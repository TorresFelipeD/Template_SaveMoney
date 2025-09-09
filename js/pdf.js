async function exportEditorPDF(containerEl, filename = "plantilla.pdf") {
    const hasLibs = typeof html2canvas !== "undefined" && typeof window.jspdf !== "undefined";
    if (!hasLibs) { window.print(); return; }
    const { jsPDF } = window.jspdf;
    const scale = 2;
    const canvas = await html2canvas(containerEl, { scale });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
        let position = 0;
        const pageCanvas = document.createElement("canvas");
        const pageCtx = pageCanvas.getContext("2d");
        const pageHeightPx = (canvas.width * pageHeight) / pageWidth;
        let remainingHeight = canvas.height;
        while (remainingHeight > 0) {
            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.min(pageHeightPx, remainingHeight);
            pageCtx.fillStyle = "#ffffff";
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            pageCtx.drawImage(canvas, 0, position, canvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
            const imgPage = pageCanvas.toDataURL("image/png");
            if (position === 0) pdf.addImage(imgPage, "PNG", 0, 0, imgWidth, pageHeight);
            else { pdf.addPage(); pdf.addImage(imgPage, "PNG", 0, 0, imgWidth, pageHeight); }
            position += pageCanvas.height; remainingHeight -= pageCanvas.height;
        }
    }
    pdf.save(filename);
}
