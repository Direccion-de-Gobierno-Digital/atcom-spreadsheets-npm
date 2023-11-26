import AtcomSpreadsheets from "../src";

const mockSheetService = {
    credentials: {
        rootFolder: "credentials",
        fileName: "credentials.json",
    },
    schemasJsonFile: 'testschema.json'
}

describe("AtcomQueryService", () => {
    describe("getRowsFromTables", () => {
        it("should return a response", async () => {
            const atcomQueryService = AtcomSpreadsheets.AtcomQueryService(mockSheetService);
            const response = await atcomQueryService.getRowsFromTables("representantes-legales", ["representanteslegales"]);
            expect(response).toBeDefined();
        });
    });
    describe("findElementByColumn", () => {
        it("should return a response", async () => {
            const atcomQueryService = AtcomSpreadsheets.AtcomQueryService(mockSheetService);
            const response = await atcomQueryService.queryRowsFromTable('representantes-legales', 'representanteslegales', 2, 'FBS961111718', true);
            expect(response).toBeDefined();
        });
    });
})