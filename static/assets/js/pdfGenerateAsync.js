const { jsPDF } = window.jspdf;
const a4Width = 297; // A4 width in mm for landscape
const minHeight = 210; // Minimum height in mm for landscape
const marginX = 5; // In mm.

let pdf = new jsPDF('l', 'mm');

let generatedPages = [];

async function generatePage(pageIndex) {
    let pageContent = document.getElementById(`page${pageIndex}`);

    if (!pageContent) return;

    // const canvas = await html2canvas(pageContent);

    const canvas = await html2canvas(pageContent);


    const imgData = canvas.toDataURL('image/png');
    console.log(imgData);

    const imgWidth = a4Width - (marginX * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = imgHeight;
    // const pageHeight = Math.max(minHeight, imgHeight);

    const generatedPage = {};

    generatedPage.pageHeight = pageHeight;
    generatedPage.imgData = imgData;
    generatedPage.imgWidth = imgWidth;
    generatedPage.imgHeight = imgHeight;
    generatedPage.pageIndex = pageIndex;

    generatedPages.push(generatedPage);
}

async function generatePDF4() {
    $('#pdfButtonContainer').hide();
    pdf = new jsPDF('l', 'mm');

    generatedPages = [];

    let pageContent1 = document.getElementById(`indexPage`);
    console.log("Processing first page");
    if(pageContent1) {
        pdf.deletePage(1);
        console.log("Adding first page");
        const canvas1 = await html2canvas(pageContent1);
        const imgData1 = canvas1.toDataURL('image/png');

        const imgWidth1 = a4Width;
        const imgHeight1 = (canvas1.height * imgWidth1) / canvas1.width;
        const pageHeight1 = imgHeight1;
        // const pageHeight1 = Math.max(minHeight, imgHeight1);

        pdf.addPage([a4Width, imgHeight1]);
        pdf.addImage(imgData1, 'PNG', 0, 0, imgWidth1, imgHeight1, '', 'FAST');
    } else {
        console.log("Removing first page");
        pdf.deletePage(1);
    }



    let pageContent2 = document.getElementById(`statsPage`);
    console.log("Processing second page");
    if(pageContent2) {
        console.log("Adding second page");
        const canvas2 = await html2canvas(pageContent2);
        const imgData2 = canvas2.toDataURL('image/png');

        const imgWidth2 = a4Width;
        const imgHeight2 = (canvas2.height * imgWidth2) / canvas2.width;
        const pageHeight2 = imgHeight2;
        // const pageHeight2 = Math.max(minHeight, imgHeight2);

        pdf.addPage([a4Width, imgHeight2]);
        pdf.addImage(imgData2, 'PNG', 0, 0, imgWidth2, imgHeight2, '', 'FAST');
    }



    console.time("generatePDF4");

    let pageIndex = 0;
    const pageGenerationPromises = [];

    // Generate promises for each page
    while (true) {
        const pagePromise = generatePage(pageIndex);
        pageGenerationPromises.push(pagePromise);
        pageIndex++;
        if (!document.getElementById(`page${pageIndex}`)) break; // Break if no more pages found
    }

    // Wait for all page generation promises to resolve
    await Promise.all(pageGenerationPromises);

    generatedPages.sort((a, b) => a.pageIndex - b.pageIndex);

    generatedPages.forEach(page => {
        pdf.addPage([a4Width, page.pageHeight]);
        pdf.addImage(page.imgData, 'PNG', marginX, 0, page.imgWidth, page.imgHeight, '', 'FAST');
    });

    console.timeEnd("generatePDF4");
    $('#pdfButtonContainer').show();

    const pdfData = pdf.output('blob');
    pdf.save(`${last_name}.pdf`);
    saveToS3(pdfData);
    function saveToS3(blob) {
        // Create FormData object to send PDF to Flask API
        const formData = new FormData();
        const timestamp1 = new Date().toISOString().replace(/[-:.]/g, '');
        // FIXME: Format filename as needed.
        const filename = `CGM_Report_${resourceId}_${timestamp1}.pdf`;
        formData.append('pdf', blob, filename);
        formData.append('userId', resourceId);
        // FIXME: next line in try catch block
        var email = document.cookie.split('; ').find(row => row.startsWith('email=')).split('=')[1];
        formData.append('email', email);

        // Send PDF Blob to Flask API endpoint
        $.ajax({
            url: '/upload-pdf',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
//                console.log('PDF uploaded successfully:', response.message);
            },
            error: function(xhr, status, error) {
                console.error('Error uploading PDF:', error);
            }
        });
    }

}

// generatePDF();
