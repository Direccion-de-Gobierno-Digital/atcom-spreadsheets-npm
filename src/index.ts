import { ArchivosBaseObj, AtcomQueryConfig, GenericObj } from "../types";
import SheetService, { ISheetService } from "./spreadsheet-service";
import helpers from "./helpers";
let _config: AtcomQueryConfig;
let _sheetService: ISheetService;
/**
 * Retrieves rows from tables in a spreadsheet.
 * @param spreadSheet - The name of the spreadsheet.
 * @param tables - An array of table names.
 * @param useSmartObject - Optional. Indicates whether to use smart object mapping. Default is true.
 * @returns A promise that resolves to an object containing the retrieved rows.
 */
async function getRowsFromTables(spreadSheet: string, tables: string[], useSmartObject: boolean = true) {
    let response = {} as ArchivosBaseObj;

    if (_config.debug) {
        console.log('Parameters:', spreadSheet, tables)
        console.log(`[AtcomQueryService] getRowsFromTables: ${spreadSheet} - ${tables}`)

    }
    response = await _sheetService.cargaRows(spreadSheet, tables);
    if (useSmartObject) {
        tables.forEach(table => {
            if (!response[table]) {
                throw new Error(`Table ${table} not found`);
            };
            response = helpers.mapIfRequired(response, useSmartObject, response[table]!.schema.columns);
        });
    }
    return response;
}

/**
 * Finds an element in a spreadsheet table by column number and ID.
 *
 * @param spreadsheet - The name of the spreadsheet.
 * @param table - The name of the table within the spreadsheet.
 * @param columnNumber - The column number to search for the element.
 * @param id - The ID of the element to find.
 * @param smartObject - Indicates whether to return the element as a smart object.
 * @returns The found element or an error if not found.
 * @throws Error if the table or element is not found, or if an unknown error occurs.
 */
async function findElementByColumn(spreadsheet: string, table: string, columnNumber: number, id: string, smartObject: boolean) {

    if (_config.debug) {
        console.log('Parameters:', spreadsheet, table, columnNumber, id, smartObject)
        console.log(`[AtcomQueryService] findElementByColumn: ${spreadsheet} - ${table} - ${columnNumber} - ${id} - ${smartObject}`)
    }


    const useSmartObject = smartObject;
    let spreadSheetLoaderResponse = {} as ArchivosBaseObj;
    try {
        spreadSheetLoaderResponse = await _sheetService.cargaRows(spreadsheet, [table]);
        if (!spreadSheetLoaderResponse[table]) throw new Error(`No se ha encontrado la(s) tabla(s): ${table}`);

        const elemento = helpers.findElementInArray(spreadSheetLoaderResponse[table]!.data, columnNumber, id);
        if (!elemento?.length) throw new Error(`No se ha encontrado el elemento: ${id}`);
        let response = elemento;
        if (useSmartObject) {
            response = helpers.mapPropertiesWithDictionary(elemento, spreadSheetLoaderResponse[table]!.schema.columns)
        }
        return response
    } catch (error) {

        if (_config.debug) console.log("Error", error);

        if (error instanceof Error) throw error;
        throw new Error("Error desconocido");
    }
}

async function queryRowsFromTable(spreadsheet: string, tabla: string, columnId: number, value: string, mapIsRequired = false) {
    if (_config.debug) {
        console.log('Parameters:', spreadsheet, tabla, columnId, value, mapIsRequired)
        console.log(`[AtcomQueryService] getRowsFromTableQuery: ${spreadsheet} - ${tabla} - ${columnId} - ${value} - ${mapIsRequired}`)
    }
    const response = {
        [tabla]: {
            data: [],
            schema: {
                columns: []
            }
        }
    } as unknown as ArchivosBaseObj;
    const data = await getRowsFromTables(spreadsheet, [tabla], false);
    if (!data[tabla] || !data[tabla] === undefined) throw new Error(`Google: No se ha encontrado la tabla: ${tabla}`);
    const filteredValues = helpers.findElementsInArray(data[tabla]!.data, columnId, value);
    if (!filteredValues) throw new Error(`No se ha encontrado el elemento: ${value}`);

    response[tabla]!.data = filteredValues;
    return helpers.mapIfRequired(response, mapIsRequired, data[tabla]!.schema.columns);
}

const AtcomQueryService = (config: AtcomQueryConfig) => {
    _config = config;
    _sheetService = SheetService(_config);

    return {
        getRowsFromTables,
        findElementByColumn,
        queryRowsFromTable
    }
}

export default AtcomQueryService;