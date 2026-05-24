"use client";

export async function exportElementToPDF(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  /* html2canvas-pro: oklch/lab 등 모던 CSS 색상 함수 지원 (Tailwind v4 호환) */
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL("image/png");
  /* A4 portrait — 210 x 297 mm */
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;

  const availableW = pageWidth - margin * 2;
  const imgHeight = (canvas.height * availableW) / canvas.width;

  if (imgHeight <= pageHeight - margin * 2) {
    pdf.addImage(imgData, "PNG", margin, margin, availableW, imgHeight);
  } else {
    /* 페이지가 넘치면 여러 페이지로 분할 */
    const pageContentHeightPx = ((pageHeight - margin * 2) * canvas.width) / availableW;
    let yPx = 0;
    let isFirst = true;
    while (yPx < canvas.height) {
      const sliceHeight = Math.min(pageContentHeightPx, canvas.height - yPx);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;
      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, -yPx);
      const sliceData = sliceCanvas.toDataURL("image/png");
      const sliceMm = (sliceHeight * availableW) / canvas.width;
      if (!isFirst) pdf.addPage();
      pdf.addImage(sliceData, "PNG", margin, margin, availableW, sliceMm);
      isFirst = false;
      yPx += sliceHeight;
    }
  }
  pdf.save(filename);
}

export async function captureElementAsImage(element: HTMLElement): Promise<string> {
  const { default: html2canvas } = await import("html2canvas-pro");
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  return canvas.toDataURL("image/png");
}
