import { ArchivosBaseObj } from './../types';
import test from "node:test";
import AtcomQueryService from "../src";
/**
 *
 * {
    "ubicacion": {
        "id": "1m0gmwlVxk1OUDevtyLD0dkZjJzm1EYTA7RqxkXDgj9Y",
        "hoja": {
            "nombre": "REPRESENTANTES LEGALES",
            "rango": "A2:ZZ",
            "nombreRango": "REPRESENTANTES LEGALES!A2:ZZ"
        }
    },
    "columnas": {
        "id": 0,
        "rLegalNumero": 1,
        "rLegalRfcProveedor": 2,
        "rLegalNombre": 3,
        "rLegalPrimerAp": 4,
        "rLegalSegundoAp": 5,
        "rLegalNombreConcatenado": 6,
        "principal": 7,
        "rCaracterLegal": 8
    },
    "keyIndex": 0
}
 *
 */
describe("AtcomQueryService", () => {
    it("should be defined", async () => {
        await test("findByName", async () => {
            const atcomQueryService = AtcomQueryService({
                credentials: {
                    rootFolder: process.env.GOOGLE_ROOT_FOLDER || "credentials",
                    fileName: process.env.GOOGLE_CREDENTIALS_FILE_NAME || "credentials.json",
                },
                schemas: [
                    {
                        tableName: "representantes-legales",
                        location: {
                            id: "1m0gmwlVxk1OUDevtyLD0dkZjJzm1EYTA7RqxkXDgj9Y",
                            sheets: [
                                {
                                    uniqueName: "representanteslegales",
                                    range: "A2:ZZ",
                                    namedRange: "REPRESENTANTES LEGALES!A2:ZZ",
                                    sheetName: "REPRESENTANTES LEGALES",
                                    columns: {
                                        id: 0,
                                        rLegalNumero: 1,
                                        rLegalRfcProveedor: 2,
                                        rLegalNombre: 3,
                                        rLegalPrimerAp: 4,
                                        rLegalSegundoAp: 5,
                                        rLegalNombreConcatenado: 6,
                                        principal: 7,
                                        rCaracterLegal: 8
                                    },
                                    typeHints: {
                                        id: "number",
                                        rLegalNumero: "number",
                                        rLegalRfcProveedor: "string",
                                        rLegalNombre: "string",
                                        rLegalPrimerAp: "string",
                                        rLegalSegundoAp: "string",
                                        rLegalNombreConcatenado: "string",
                                        principal: "boolean",
                                        rCaracterLegal: "string"
                                    },
                                    keyIndex: 0
                                }
                            ]
                        }
                    }
                ]
            });
            const response = await atcomQueryService.getRowsFromTables('representantes-legales', ['representanteslegales'], true);

            expect(response.representantesLegales).toBeDefined();
        })
    })
})