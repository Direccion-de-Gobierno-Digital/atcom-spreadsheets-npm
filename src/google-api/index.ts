/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import axios from 'axios';

import type { GoogleAuth } from "google-auth-library";
import type { JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { drive_v3, Auth, sheets_v4, docs_v1 } from "googleapis";
import { join } from "path";
import { Readable } from "stream";
import { GoogleApiConfig } from '../../types';
let _auth: GoogleAuth<JSONClient>;
let _config: GoogleApiConfig;
let _debug: boolean | undefined;
//SCOPES necesarios para acceder a los archivos de google drive
//ID de la carpeta donde se guardan los contratos
/**
 * Crea la instancia de autenticación de google
 * @returns GoogleAuth<JSONClient>9-8
 */
function authGoogle(config: { rootFolder: string, fileName: string }): GoogleAuth<JSONClient> {
    if (_auth) return _auth;
    const jsonDirectory = join(process.cwd(), config.rootFolder);
    _auth = new Auth.GoogleAuth({
        keyFile: join(jsonDirectory, config.fileName),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    return _auth;
}
/**
 * Procesa el buffer del archivo de word y lo sube a google drive
 * @param fileName
 * @param buf
 */
async function readAndUpload(fileName: string, buf: never, mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document", folderId: string) {
    try {
        const auth = authGoogle(_config);
        const drive = new drive_v3.Drive({ auth: auth });
        const fileMetadata = {
            name: fileName,
            parents: [folderId]
        };
        const media = {
            mimeType: mimeType,
            body: Readable.from(buf)
        };
        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id,name",
        });
        if (_debug) {
            console.log("[readAndUpload] File Id: ", file.data.id!);
            console.log("[readAndUpload] file created: ", file);
        }
        return file.data.id!;
    } catch (error) {
        if (_debug) {
            console.log("[readAndUpload] Error");
            console.log(error);
        }
        throw error;
    }
}
/**
 *
 * @param sheetId id de la hoja de google sheets
 * @param range rango de la hoja de google sheets (ejemplo: "CONTRATOS!A2:ZZ1000")
 * @returns array de arrays con los datos de la hoja de google sheets
 */
async function getGoogleSheetData(sheetId: string, range: string): Promise<string[][]> {
    try {
        const auth = authGoogle(_config);
        const sheets = new sheets_v4.Sheets({ auth: auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: range,
        });
        const rows = response.data.values;
        if (!rows) return [];
        if (rows.length) {
            return rows as string[][];
        } else {
            return [[]];
        }
    } catch (error) {
        if (_debug) {

            console.log("[getGoogleSheetData] ERROR " + sheetId + "rango: " + range);

        }
        throw error;
    }
}

async function findFilesByName(folderId: string, name: string, strict = true): Promise<drive_v3.Schema$File[]> {
    try {
        const auth = authGoogle(_config);
        const drive = new drive_v3.Drive({ auth: auth });
        const response = await drive.files.list({
            q: `name contains '${name}' and '${folderId}' in parents`,
            fields: "files(*)",
            spaces: "drive",
        });
        if (!response.data.files) return [];
        if (strict) {
            const file = response.data.files.filter(file => file.name === name);
            console.log("file", file);
            return file;
        }
        return response.data.files;
    } catch (error) {
        if (_debug) {
            console.log("[findFilesByName] Error");
            console.log(error);
        }
        throw error;
    }
}

async function downloadGoogleDocAsText(docId: string) {
    try {
        const auth = authGoogle(_config);
        const docs = new docs_v1.Docs({ auth });

        const docData = await docs.documents.get({
            documentId: docId,
            fields: "body/content"
        })

        return docData.data.body;
    } catch (error) {
        if (_debug) {
            console.log("[downloadGoogleDocAsText] Error");
            console.log(error);
        }
        throw error;
    }
}
/**
 *
 * @param docId id del documento de google docs
 * @returns buffer del documento de google docs
 */
async function downloadGoogleDocAsStream(docId: string) {
    try {
        const auth = authGoogle(_config);
        const drive = new drive_v3.Drive({ auth: auth });
        const response = drive.files.get({ fileId: docId, supportsTeamDrives: true, supportsAllDrives: true, fields: "webContentLink" });
        const responseData = await response;
        const downloadUrl = responseData.data.webContentLink!;
        const responseAxios = await axios({
            method: "get",
            url: downloadUrl,
            responseType: "stream",
        });
        const buffer = await new Promise((resolve, reject) => {
            const chunks: Uint8Array[] = [];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            responseAxios.data
                .on("data", (chunk: Uint8Array) => chunks.push(chunk))
                .on("end", () => resolve(Buffer.concat(chunks)))
                .on("error", reject);


        });
        return buffer;
    } catch (error) {
        if (_debug) {
            console.log("[downloadGoogleDocAsStream] Error");
            console.log(error);
        }
        throw error;
    }
}
async function alternativeDownloadAsStream(docId: string) {
    try {
        const auth = authGoogle(_config);
        const drive = new drive_v3.Drive({ auth: auth });
        const res = await drive.files.get({
            fileId: docId,
            alt: 'media',
        }, { responseType: 'stream' });

        const buffer = await new Promise((resolve, reject) => {
            const chunks: Uint8Array[] = [];
            res.data
                .on("data", (chunk: Uint8Array) => chunks.push(chunk))
                .on("end", () => resolve(Buffer.concat(chunks)))
                .on("error", reject);
        });

        return buffer as Buffer;
    } catch (error) {
        if (_debug) {
            console.log("[alternativeDownloadAsStream] Error");
            console.log(error);
        }
        throw error;
    }
}
async function insertGoogleSheetData(docId: string, bookAndRange: string, data: string[][]) {
    try {
        const auth = authGoogle(_config);
        const sheets = new sheets_v4.Sheets({ auth: auth });
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: docId,
            range: bookAndRange,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: data
            }
        });
        return response;
    } catch (error) {
        if (_debug) {
            console.log("[insertGoogleSheetData] Error");
            console.log(error);
        }
        throw error;
    }
}
async function updateSheetRow(docId: string, book: string, row: number, data: never[]) {
    try {
        const auth = authGoogle(_config);
        const sheets = new sheets_v4.Sheets({ auth: auth });
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: docId,
            range: `${book}!A${row}:ZZ${row}`,
            valueInputOption: "RAW",
            requestBody: {
                values: [data]
            }
        });
        return response;
    } catch (error) {
        if (_debug) {
            console.log("[updateSheetRow] Error");
            console.log(error);
        }
        throw error;
    }
}

async function appendGoogleSheetData(docId: string, book: string, data: string[][]) {
    try {
        const auth = authGoogle(_config);
        const sheets = new sheets_v4.Sheets({ auth: auth });
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: docId,
            range: `${book}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: data
            }
        });
        return response;
    } catch (error) {
        if (_debug) {
            console.log("[appendGoogleSheetData] Error");
            console.log(error);
        }
        throw error;
    }
}
async function updateSheetRowAtIndex(docId: string, book: string, index: number, data: string[]) {
    try {
        const auth = authGoogle(_config);
        const sheets = new sheets_v4.Sheets({ auth: auth });
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: docId,
            range: `${book}!A${index}:ZZ${index}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [data]
            }
        });
        return response;
    } catch (error) {
        if (_debug) {
            console.log("[updateSheetRowAtIndex] Error");
            console.log(error);
        }
        throw error;
    }
}

async function downloadJsonFile(docId: string) {
    try {
        const auth = authGoogle(_config);
        const drive = new drive_v3.Drive({ auth: auth });
        const response = drive.files.get({ fileId: docId, supportsTeamDrives: true, supportsAllDrives: true, alt: "media" });
        const responseData = (await response).data;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return responseData;
    } catch (error) {
        console.log("ERROR", error);
        throw error;
    }
}

export type IGoogleApi = {
    authGoogle: typeof authGoogle,
    readAndUpload: typeof readAndUpload,
    getGoogleSheetData: typeof getGoogleSheetData,
    downloadGoogleDocAsStream: typeof downloadGoogleDocAsStream,
    insertGoogleSheetData: typeof insertGoogleSheetData,
    downloadGoogleDocAsText: typeof downloadGoogleDocAsText,
    updateSheetRow: typeof updateSheetRow,
    alternativeDownloadAsStream: typeof alternativeDownloadAsStream,
    appendGoogleSheetData: typeof appendGoogleSheetData,
    updateSheetRowAtIndex: typeof updateSheetRowAtIndex,
    downloadJsonFile: typeof downloadJsonFile,
    findFilesByName: typeof findFilesByName
}

const GoogleApi = (config: GoogleApiConfig, debug?: boolean): IGoogleApi => {
    _config = config;
    _debug = debug;
    return {
        authGoogle,
        readAndUpload,
        getGoogleSheetData,
        downloadGoogleDocAsStream,
        insertGoogleSheetData,
        downloadGoogleDocAsText,
        updateSheetRow,
        alternativeDownloadAsStream,
        appendGoogleSheetData,
        updateSheetRowAtIndex,
        downloadJsonFile,
        findFilesByName
    }

}

export default GoogleApi;