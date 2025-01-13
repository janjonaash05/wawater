// npm install xlsx nodemailer
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');

class ExcelUtility {
    /**
     * 
     * @param {string} filePath - cesta k excel souboru
     * @returns {Object} 
     */
    static readConsumptionData(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets["Měsíční spotřeby"];
            
            const year = sheet['A1']?.v;
            
            // convert to json 
            const data = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                range: 1 // skipnuti header radku
            });

            const monthlyData = data.map(row => ({
                teplo: row[1] || 0,      // Column B
                studena: row[2] || 0,     // Column C atd.
                tepla: row[3] || 0        
            }));

            return {
                year,
                monthlyData
            };
        } catch (error) {
            console.error('Error reading Excel file:', error);
            throw error;
        }
    }

    static createConsumptionReport(data, year) {
        const workbook = XLSX.utils.book_new();

        // headers
        const headers = ['Měsíc', 'Teplo (GJ)', 'Studená voda (m³)', 'Teplá voda (m³)'];
        const months = [
            'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
            'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
        ];

        // worksheet data
        const wsData = [
            [year],
            headers,
            ...data.map((item, index) => [
                months[index],
                item.teplo,
                item.studena,
                item.tepla
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // basic formatovani
        ws['!cols'] = [
            { wch: 15 }, // Month column width
            { wch: 12 }, // Heat column width
            { wch: 15 }, // Cold water column width
            { wch: 15 }  // Hot water column width
        ];

        XLSX.utils.book_append_sheet(workbook, ws, "Měsíční spotřeby");
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    static async sendReportEmail(excelBuffer, email, year) {
        const transporter = nodemailer.createTransport({
            host: 'smtp.example.com', // Replace with your SMTP server
            port: 587,
            secure: false,
            auth: {
                user: 'your-email@example.com',
                pass: 'your-password'
            }
        });

        await transporter.sendMail({
            from: 'your-email@example.com',
            to: email,
            subject: `Přehled spotřeby ${year}`,
            text: `V příloze naleznete přehled spotřeby za rok ${year}.`,
            attachments: [{
                filename: `spotreba_${year}.xlsx`,
                content: excelBuffer
            }]
        });
    }
}

module.exports = ExcelUtility;