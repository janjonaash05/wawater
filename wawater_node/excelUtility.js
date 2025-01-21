// npm install xlsx nodemailer
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');

class ExcelUtility {
    /**
     * @param {string} filePath
     * @returns {Object} zpracovava data meridel
     */
    static readMeterData(filePath) {
        try {

            const workbook = XLSX.read(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[1]];

            // tohle bere info o klientovy z headeru
            const clientInfo = {
                date: sheet['A2']?.v,
                client: sheet['B2']?.v,
                property_name: sheet['C2']?.v
            };


            const gaugeDataRaw = XLSX.utils.sheet_to_json(sheet, {
                header: 1, //convert to 2D array
                blankrows: false
            })

              // Odstranění prázdných řádků

            let gaugeData = [];
            for (let i = 3; i < gaugeDataRaw.length; i++) {
                gaugeData.push(
                    {
                        guid: gaugeDataRaw[i][0],
                        value: gaugeDataRaw[i][1],
                    });
            }


            return {
                client_info: clientInfo,
                gauge_data: gaugeData,
                l:gaugeDataRaw.length
            };

        } catch (error) {
            console.error('Chyba při čtení Excel souboru:', error);
            return error;
        }
    }


    static createMeterReport(data, month, year) {
        const workbook = XLSX.utils.book_new();
        const page_headers = [
            ["GUID","Výrobní číslo","Umístění","Typ","jednotka","Název nemovitosti","Adresa","Stav k "+ (month+"/"+year)],
            ["měřidlo","jednotka","leden","únor","březen","duben","květen","červen","červenec","srpen","září","říjen","listopad","prosinec"]
        ];

        // pridavani odectu meridel
        const sheet_all_gauges_data = [
            page_headers[0],
        ];
        for(let row of data.all_gauge_data)
        {
            sheet_all_gauges_data.push( Object.values(row));
        }

        const sheet_gauge_type_spending_data =
            [
                page_headers[1],
            ]

        for (let month_data of data.gauge_type_month_spendings)
        {
            sheet_gauge_type_spending_data.push(month_data);
        }




        const sheet_gauge_type_spending = XLSX.utils.aoa_to_sheet(sheet_gauge_type_spending_data);


        const sheet_all_gauges = XLSX.utils.aoa_to_sheet(sheet_all_gauges_data);

        XLSX.utils.book_append_sheet(workbook, sheet_all_gauges, "Odečty měřidel");
        XLSX.utils.book_append_sheet(workbook, sheet_gauge_type_spending, "Roční přehled");
        return XLSX.write(workbook, {type: 'buffer', bookType: 'xlsx'});
    }

    // metoda na odesilani mailu
    static async sendReportEmail(excelBuffer, email, reportInfo) {
        const transporter = nodemailer.createTransport({
            host: 'smtp.seznam.cz',
            port: 587,
            secure: false,
            auth: {
                user: 'ddcorp@seznam.cz',
                pass: process.env.EMAIL_PASSWORD // Mělo by být nastaveno v prostředí
            }
        });

        const date = new Date().toLocaleDateString('cs-CZ');

        await transporter.sendMail({
            from: 'ddcorp@seznam.cz',
            to: email,
            subject: `Odečty měřidel - ${reportInfo.property} - ${date}`,
            text: `V příloze naleznete přehled odečtů měřidel pro nemovitost ${reportInfo.property} ze dne ${date}.`,
            attachments: [{
                filename: `odecty_${date.replace(/\./g, '_')}.xlsx`,
                content: excelBuffer
            }]
        });
    }

    /**
     * validace odectu
     * @param {Array} meterData - array odectu meridel
     * @param {Object} dbMeters - zaznamy meridel z db
     */
    static validateMeterReadings(meterData, dbMeters) {
        const validationResults = {
            valid: true,
            errors: []
        };

        meterData.forEach(meter => {
            const dbMeter = dbMeters.find(m => m.guid === meter.guid);

            if (!dbMeter) {
                validationResults.valid = false;
                validationResults.errors.push(`Neznámé měřidlo: ${meter.guid}`);
                return;
            }

            if (dbMeter.location_sign !== meter.location) {
                validationResults.valid = false;
                validationResults.errors.push(
                    `Nesouhlasí umístění měřidla ${meter.guid}: ${meter.location} vs. ${dbMeter.location_sign}`
                );
            }
        });

        return validationResults;
    }
}

module.exports = ExcelUtility;