import * as docx from 'docx';
import JSZip from 'jszip';
import { DocFile } from '../types';

/**
 * Merges multiple DOCX files by embedding them as "AltChunks" into a master document.
 * This preserves full formatting, images, tables, and styles of the original documents.
 * 
 * Strategy:
 * 1. Create a minimal "skeleton" DOCX with placeholders.
 * 2. Use JSZip to inject the original files as "AltChunks".
 * 3. Replace placeholders with <w:altChunk> tags.
 */
export const mergeDocs = async (files: DocFile[]): Promise<Blob> => {
  // 1. Create the "Skeleton" Document
  // It acts only as a container. We do NOT add Titles or custom TOCs here.
  const children: docx.Paragraph[] = [];

  files.forEach((file, index) => {
    // If not the first file, add a page break to ensure documents start on new pages.
    if (index > 0) {
      children.push(
        new docx.Paragraph({
          children: [new docx.PageBreak()],
        })
      );
    }

    // Placeholder Paragraph. 
    // We will find this exact text in the XML and replace the whole paragraph with an <altChunk> tag.
    children.push(
      new docx.Paragraph({
        text: `__ALTCHUNK_${index}__`, 
      })
    );
  });

  // Generate the skeleton blob.
  // We enable 'updateFields' so that if the *original* documents contained TOC fields,
  // Word will prompt to update them when opened.
  const skeletonDoc = new docx.Document({
    features: {
      updateFields: true,
    },
    sections: [{ 
      properties: {}, 
      children 
    }],
  });

  const skeletonBlob = await docx.Packer.toBlob(skeletonDoc);

  // 2. Open Skeleton with JSZip to inject content
  const zip = await JSZip.loadAsync(skeletonBlob);
  
  // Helpers to manipulate XML
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  
  const contentTypesXmlStr = await zip.file("[Content_Types].xml")?.async("text");
  const relsXmlStr = await zip.file("word/_rels/document.xml.rels")?.async("text");
  const docXmlStr = await zip.file("word/document.xml")?.async("text");

  if (!contentTypesXmlStr || !relsXmlStr || !docXmlStr) {
    throw new Error("Invalid DOCX structure generated");
  }

  const contentTypesDoc = parser.parseFromString(contentTypesXmlStr, "application/xml");
  const relsDoc = parser.parseFromString(relsXmlStr, "application/xml");
  const mainDoc = parser.parseFromString(docXmlStr, "application/xml");

  // 3. Iterate files and inject
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const chunkFileName = `chunk_${i}.docx`;
    const rId = `rIdAltChunk${i}`;

    // A. Add file binary to zip
    const fileData = await file.file.arrayBuffer();
    zip.file(`word/${chunkFileName}`, fileData);

    // B. Update [Content_Types].xml
    // Register the new part
    const typesRoot = contentTypesDoc.getElementsByTagName("Types")[0];
    const override = contentTypesDoc.createElementNS("http://schemas.openxmlformats.org/package/2006/content-types", "Override");
    override.setAttribute("PartName", `/word/${chunkFileName}`);
    override.setAttribute("ContentType", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml");
    typesRoot.appendChild(override);

    // C. Update word/_rels/document.xml.rels
    // Link the new part to the document
    const relsRoot = relsDoc.getElementsByTagName("Relationships")[0];
    const rel = relsDoc.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
    rel.setAttribute("Id", rId);
    rel.setAttribute("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk");
    rel.setAttribute("Target", `${chunkFileName}`);
    relsRoot.appendChild(rel);

    // D. Replace Placeholder in word/document.xml
    // Find <w:p> containing "__ALTCHUNK_0__" and replace with <w:altChunk r:id="rIdAltChunk0"/>
    const paragraphs = mainDoc.getElementsByTagName("w:p");
    for (let j = 0; j < paragraphs.length; j++) {
      const p = paragraphs[j];
      if (p.textContent?.includes(`__ALTCHUNK_${i}__`)) {
        const altChunk = mainDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:altChunk");
        altChunk.setAttribute("r:id", rId);
        p.parentNode?.replaceChild(altChunk, p);
        break;
      }
    }
  }

  // 4. Save modified XMLs back to zip
  zip.file("[Content_Types].xml", serializer.serializeToString(contentTypesDoc));
  zip.file("word/_rels/document.xml.rels", serializer.serializeToString(relsDoc));
  zip.file("word/document.xml", serializer.serializeToString(mainDoc));

  // 5. Generate final Blob
  return await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE"
  });
};