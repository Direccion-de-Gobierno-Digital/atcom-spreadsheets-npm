import { ArchivosBaseObj, AtcomQueryConfig, GenericObj } from "../types";
import SheetService, { ISheetService } from "./spreadsheet-service";
import helpers from "./helpers";
let _config: AtcomQueryConfig;
let _sheetService: ISheetService;

// T is the type of the object to return
// T is optional, if not provided, the function will return a GenericObj
async function getRowsFromTables<T>(spreadSheet: string, tables: string[], autoMap: boolean = true) {
    let response = {} as ArchivosBaseObj<T>;

    if (_config.debug) {
        console.log('Parameters:', spreadSheet, tables)
        console.log(`[AtcomQueryService] getRowsFromTables: ${spreadSheet} - ${tables}`)

    }
    response = await _sheetService.cargaRows(spreadSheet, tables);
    if (autoMap) {
        tables.forEach(table => {
            if (!response[table]) {
                throw new Error(`Table ${table} not found`);
            };
            response = helpers.mapIfRequired(response, autoMap, response[table]!.schema.columns);
        });
    }
    return response;
}

async function findElementByColumn<T>(spreadsheet: string, table: string, columnNumber: number, id: string, autoMap: boolean) {

    if (_config.debug) {
        console.log('Parameters:', spreadsheet, table, columnNumber, id, autoMap)
        console.log(`[AtcomQueryService] findElementByColumn: ${spreadsheet} - ${table} - ${columnNumber} - ${id} - ${autoMap}`)
    }


    const useSmartObject = autoMap;
    let spreadSheetLoaderResponse = {} as ArchivosBaseObj<T>;
    try {
        spreadSheetLoaderResponse = await _sheetService.cargaRows(spreadsheet, [table]);
        if (!spreadSheetLoaderResponse[table]) throw new Error(`No se ha encontrado la(s) tabla(s): ${table}`);

        const elemento = helpers.findElementInArray(spreadSheetLoaderResponse[table]!.data, columnNumber, id);

        let response = elemento;
        // check if element is typeof string[]
        if (Array.isArray(elemento)) {
            //return elemento as unknown as T;
            if (!elemento?.length) throw new Error(`No e ha encontrado el elemento: ${id}`);
            response = elemento as unknown as T;
        }
        if (useSmartObject && typeof elemento === 'object') {
            response = helpers.mapPropertiesWithDictionary<T>(elemento, spreadSheetLoaderResponse[table]!.schema.columns);
        }
        return response
    } catch (error) {

        if (_config.debug) console.log("Error", error);

        if (error instanceof Error) throw error;
        throw new Error("Error desconocido");
    }
}

async function queryRowsFromTable<T>(spreadsheet: string, tabla: string, columnId: number, value: string, autoMap = false) {
    if (_config.debug) {
        console.log('Parameters:', spreadsheet, tabla, columnId, value, autoMap)
        console.log(`[AtcomQueryService] getRowsFromTableQuery: ${spreadsheet} - ${tabla} - ${columnId} - ${value} - ${autoMap}`)
    }
    const response = {
        [tabla]: {
            data: [],
            schema: {
                columns: []
            }
        }
    } as unknown as ArchivosBaseObj<T>;
    const data = await getRowsFromTables<T>(spreadsheet, [tabla], false);
    if (!data[tabla] || !data[tabla] === undefined) throw new Error(`Google: No se ha encontrado la tabla: ${tabla}`);
    const filteredValues = helpers.findElementsInArray<T>(data[tabla]!.data, columnId, value);
    if (!filteredValues) throw new Error(`No se ha encontrado el elemento: ${value}`);

    response[tabla]!.data = filteredValues;
    return helpers.mapIfRequired(response, autoMap, data[tabla]!.schema.columns);
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

const AtcomSpreadsheets = {
    AtcomQueryService
}

export default AtcomSpreadsheets;

