#!/usr/bin/env node
import fs from 'fs';
import { program } from 'commander';
import { SpreadsheetTableSchema } from '../types';
import { env } from 'process';

let schemas = [] as SpreadsheetTableSchema[];

program.name('atcom-spreadsheets-util')
    .description('CLI to generate types and names from spreadsheets')
    .version('0.5.13');


program.command('generate-types').argument('<folder>', 'Folder where types will be created').description('Create types from spreadsheets').action(createTableTypes);

program.command('generate-names').description('Create names from spreadsheets').action(createTableNames);

program.command('generate').description('Create types and names from spreadsheets').action((args) => {
    createTableTypes(args);
    createTableNames();
});

function createTableTypes(args: string) {
    let folder = args;

    if (folder === undefined || folder === '') folder = '/spreadsheet-types';

    //if folder doesnt start with / add it
    if (!folder.startsWith('/')) folder = `/${folder}`;

    loadSchemasJsonFile();
    createTypesInSingleFile(schemas, folder);

}

function formatTypeName(name: string) {
    // ex name: 'Categorías de productos' -> 'categoriasDeProductos' remove special characters and spaces
    return name.replace(/[^a-zA-Z0-9]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('').replace(/\s/g, '');
}

function createTypesInSingleFile(schemas: SpreadsheetTableSchema[], folder = '/spreadsheet-types') {
    // check all schemas and create types in a single file for each sheet
    const types = schemas.map(schema => {
        const columns = schema.location.sheets.map(sheet => sheet.columns);

        // columns is a record <string, number> where the key is the column name and type value is always string
        let typeFile = `export type ${formatTypeName(schema.tableName)} = `;
        typeFile += '{ ';
        columns.forEach(column => {
            // get string values from columns
            // get key values from columns
            const keys = Object.keys(column);
            // keys are the property names of the type
            keys.forEach(key => {
                typeFile += `${key}: string;`;
            });
        });
        typeFile += '};';
        return typeFile;
    });
    const folderLocation = `${process.cwd()}${folder}`;
    // create folder if not exists
    fs.mkdirSync(folderLocation, { recursive: true });
    fs.writeFileSync(`${folderLocation}/index.ts`, types.join('\n'));
}

function createTypesForEachSheet(schemas: SpreadsheetTableSchema[]) {
    // create types file for each sheet
    schemas.forEach(schema => {
        const columns = schema.location.sheets.map(sheet => sheet.columns);
        const typeFile = `export type ${formatTypeName(schema.tableName)} = {\n${Object.keys(columns).map(key => `    ${key}: ${columns[key as keyof typeof columns] === 0 ? 'string' : 'number'}`).join(',\n')}\n}`;
        const folderLocation = `${process.cwd()}/types/${schema.tableName}`;
        // create folder if not exists
        fs.mkdirSync(folderLocation, { recursive: true });
        fs.writeFileSync(`${folderLocation}/types.ts`, typeFile);
    });
}

function createTableNames() {
    loadSchemasJsonFile();
    console.log('createTableNames')
    console.log(schemas)
}

function loadSchemasJsonFile(envLocation: string = 'testschema.json') {
    try {
        console.log('loadJsonFile')
        const file = fs.readFileSync(`${process.cwd()
            }/${env.SPREADHSEET_SCHEMA_JSON || envLocation}`, { encoding: "utf-8" });
        schemas = JSON.parse(file) as SpreadsheetTableSchema[];

    } catch (error) {
        console.log(error)
        throw new Error("No se encontró el archivo de configuración de schemas");
    }
}

program.parse(process.argv);
