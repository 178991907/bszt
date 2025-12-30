
import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function usePDFGenerator() {
    const [isDownloading, setIsDownloading] = useState(false);

    const generatePDF = async (elementId: string, filename: string = 'worksheet.pdf') => {
        const element = document.getElementById(elementId);
        if (!element) return;

        setIsDownloading(true);

        try {
            // Get all character pages
            const characterPages = element.querySelectorAll('.character-page');
            if (characterPages.length === 0) return;

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < characterPages.length; i++) {
                const page = characterPages[i] as HTMLElement;

                // Temporarily adjust page style for screenshot
                const originalStyle = page.style.cssText;
                page.style.width = '210mm';
                page.style.minHeight = '297mm';
                page.style.backgroundColor = '#ffffff';
                page.style.position = 'relative';
                page.style.padding = '20px';
                page.style.boxSizing = 'border-box';

                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: page.scrollWidth,
                    height: page.scrollHeight
                });

                // Restore original style
                page.style.cssText = originalStyle;

                const imgData = canvas.toDataURL('image/png');

                if (i > 0) {
                    pdf.addPage();
                }

                // Calculate image dimensions in PDF to maintain aspect ratio
                const canvasAspectRatio = canvas.width / canvas.height;
                const pdfAspectRatio = pdfWidth / pdfHeight;

                let finalWidth, finalHeight;
                if (canvasAspectRatio > pdfAspectRatio) {
                    finalWidth = pdfWidth;
                    finalHeight = pdfWidth / canvasAspectRatio;
                } else {
                    finalHeight = pdfHeight;
                    finalWidth = pdfHeight * canvasAspectRatio;
                }

                const x = (pdfWidth - finalWidth) / 2;
                const y = (pdfHeight - finalHeight) / 2;

                pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            }

            pdf.save(filename);

        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return {
        isDownloading,
        generatePDF
    };
}
