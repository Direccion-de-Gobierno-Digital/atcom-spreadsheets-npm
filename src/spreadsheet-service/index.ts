
import { ArchivoBaseContent, ArchivosBaseObj, AtcomQueryConfig, SpreadsheetTableSchema } from "../../types";
import GoogleApi, { IGoogleApi } from "../google-api";
import fs from "fs";
let googleAppService: IGoogleApi;
let _config: AtcomQueryConfig;
let _schemas: AtcomQueryConfig["schemas"];


const cargaRows = async (spreadsheet: string, tables: string[] | string) => {
    if (typeof tables === "string") {
        tables = [tables];
    }

    const spreadSheetSchema = helpers.findSpreashsheetInSchemas(spreadsheet)

    if (!spreadSheetSchema) { throw new Error(`No se encontró el spreadsheet ${spreadsheet} en la lista de tablas`); }

    const result = {} as ArchivosBaseObj;
    await Promise.all(tables.map(async (table, index) => {
        const sheet = helpers.findTableInSpreadsheetSchema(spreadSheetSchema, table);
        if (result[table] === undefined) {
            result[table] = {} as ArchivoBaseContent;
        }
        const location = spreadSheetSchema.location;
        const data = await googleAppService.getGoogleSheetData(location.id, sheet.namedRange);
        result[table]!.data = data;
        result[table]!.schema = sheet;

    }));
    return result;
}
async function writeRows(spreadsheet: string, table: string, data: string[][], hasColumns = false) {
    const spreadSheetSchema = helpers.findSpreashsheetInSchemas(spreadsheet)

    if (!spreadSheetSchema) { throw new Error(`No se encontró el spreadsheet ${spreadsheet} en la lista de tablas`); }
    const sheet = helpers.findTableInSpreadsheetSchema(spreadSheetSchema, table);
    console.log("Escribiendo en la tabla", table);
    const location = spreadSheetSchema.location;
    const nombreRango = sheet.namedRange;
    // replace number 2 with 1 in nombreRango
    const nombreHoja = hasColumns ? nombreRango.replace(/2/, "1") : nombreRango.replace(/1/, "2");
    return await googleAppService.insertGoogleSheetData(location.id, nombreHoja, data);
}

async function appendRows(spreadsheet: string, table: string, data: string[][], hasColumns = false) {
    const spreadSheetSchema = helpers.findSpreashsheetInSchemas(spreadsheet)

    if (!spreadSheetSchema) { throw new Error(`No se encontró el spreadsheet ${spreadsheet} en la lista de tablas`); }
    const sheet = helpers.findTableInSpreadsheetSchema(spreadSheetSchema, table);
    console.log("Escribiendo en la tabla", table);
    const location = spreadSheetSchema.location;
    const nombreRango = sheet.namedRange;

    // replace number 2 with 1 in nombreRango
    const nombreHoja = hasColumns ? nombreRango.replace(/2/, "1") : nombreRango.replace(/1/, "2");
    console.log("nombreHoja", nombreHoja);
    return googleAppService.appendGoogleSheetData(location.id, nombreHoja, data);
}

async function getIndexOfRowInBook(spreadsheet: string, table: string, value: string, column: number) {
    const spreadSheetSchema = helpers.findSpreashsheetInSchemas(spreadsheet)

    if (!spreadSheetSchema) { throw new Error(`No se encontró el spreadsheet ${spreadsheet} en la lista de tablas`); }
    const sheet = helpers.findTableInSpreadsheetSchema(spreadSheetSchema, table);
    const indexOffset = 2; // 1 para el header y 1 para el offset de la api
    const location = spreadSheetSchema.location;
    const data = await googleAppService.getGoogleSheetData(location.id, sheet.namedRange);
    console.log("data", data);
    const index = data.findIndex(row => {
        console.log(row[column], value);
        return row[column] === value;
    });
    return index < 0 ? -1 : index + indexOffset;
}

async function updateRowAtIndex(spreadsheet: string, table: string, index: number, data: string[]) {
    const spreadSheetSchema = helpers.findSpreashsheetInSchemas(spreadsheet)

    if (!spreadSheetSchema) { throw new Error(`No se encontró el spreadsheet ${spreadsheet} en la lista de tablas`); }
    const sheet = helpers.findTableInSpreadsheetSchema(spreadSheetSchema, table);
    const location = spreadSheetSchema.location;
    return googleAppService.updateSheetRowAtIndex(location.id, sheet.sheetName, index, data);
}


const helpers = {
    findSpreashsheetInSchemas: (spreadSheetName: string) => {
        const table = _schemas?.find(table => table.tableName === spreadSheetName);
        if (!table) {
            throw new Error(`La tabla ${spreadSheetName} no existe en la lista de tablas`);
        }
        return table;
    },
    findTableInSpreadsheetSchema: (spreadSheetName: SpreadsheetTableSchema, tableName: string) => {
        const table = spreadSheetName.location.sheets.find(table => table.uniqueName === tableName);
        if (!table) {
            throw new Error(`La tabla ${tableName} no existe en el spreadsheet ${spreadSheetName}`);
        }
        return table;

    }
}

const SheetLoaderService = {
    cargaRows
}
const SheetWritterService = {
    writeRows,
    appendRows,
    getIndexOfRowInBook,
    updateRowAtIndex
}

export type ISheetService = typeof SheetLoaderService & typeof SheetWritterService

const SheetService = (config: AtcomQueryConfig): ISheetService => {
    _config = config;
    googleAppService = GoogleApi(_config.credentials);
    if (!_config.schemasJsonFile && !_config.schemas) {
        throw new Error("No se encontró el archivo de configuración de schemas");
    }
    if (_config.schemasJsonFile) {
        // this is a npm package, so we need to use __dirname to get the path
        const file = fs.readFileSync(`${process.cwd()}/${_config.schemasJsonFile}`, { encoding: "utf-8" });
        _schemas = JSON.parse(file);
    }
    else _schemas = _config.schemas;
    return {
        ...SheetLoaderService,
        ...SheetWritterService
    }
}

export default SheetService;