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

    /**
     * @param {Object} data - data odectu meridel
     * @returns {Buffer} excel soubor jako buffer
     */
    static createMeterReport(data) {
        const workbook = XLSX.utils.book_new();

        // header data klienta
        const headerData = [
            ['Datum', 'Klient', 'Adresa', 'Název nemovitosti'],
            [data.clientInfo.date, data.clientInfo.client, data.clientInfo.address, data.clientInfo.property],
            [],
            ['Umístění', 'Typ', 'Výrobní číslo', 'Odečet']
        ];

        // pridavani odectu meridel
        const wsData = [
            ...headerData,
            ...data.meterData.map(meter => [
                meter.location,
                meter.type,
                meter.guid,
                meter.decrease
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // basic formatovani - klidne uprav jak je libo
        ws['!cols'] = [
            {wch: 15}, // umisteni
            {wch: 12}, // typ
            {wch: 20}, // UID
            {wch: 12}  // odecet
        ];

        XLSX.utils.book_append_sheet(workbook, ws, "Odečty měřidel");
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