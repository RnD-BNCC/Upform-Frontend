type ExcelExportOptions = {
  columns: string[];
  fileName: string;
  rows: string[][];
  sheetName?: string;
};

const PRIMARY_COLOR = "#0054A5";
const BORDER_COLOR = "#CBD5E1";
const HEADER_BORDER_COLOR = "#B8CAE0";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeFileName(value: string) {
  const withoutControlCharacters = value
    .split("")
    .filter((character) => character.charCodeAt(0) >= 32)
    .join("");
  const sanitized = withoutControlCharacters
    .trim()
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, " ");
  return sanitized || "responses";
}

function sanitizeSheetName(value: string) {
  const sanitized = value.trim().replace(/[:\\/?*[\]]/g, " ").slice(0, 31);
  return sanitized || "Responses";
}

function getColumnWidths(columns: string[], rows: string[][]) {
  return columns.map((column, columnIndex) => {
    const contentLengths = rows.map(
      (row) => String(row[columnIndex] ?? "").length,
    );
    const maxLength = Math.max(column.length, ...contentLengths);
    return Math.min(Math.max(maxLength * 7 + 24, 80), 360);
  });
}

function createRow(cells: string[], styleId: string) {
  return `<Row>${cells
    .map(
      (cell) =>
        `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(
          String(cell ?? ""),
        )}</Data></Cell>`,
    )
    .join("")}</Row>`;
}

export function exportExcelWorkbook({
  columns,
  fileName,
  rows,
  sheetName = "Responses",
}: ExcelExportOptions) {
  const widths = getColumnWidths(columns, rows);
  const worksheetName = sanitizeSheetName(sheetName);
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:FontName="Montserrat" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="${PRIMARY_COLOR}" ss:Pattern="Solid"/>
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="${HEADER_BORDER_COLOR}"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${HEADER_BORDER_COLOR}"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${HEADER_BORDER_COLOR}"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${HEADER_BORDER_COLOR}"/>
      </Borders>
    </Style>
    <Style ss:ID="Cell">
      <Font ss:FontName="Montserrat" ss:Color="#111827"/>
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER_COLOR}"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER_COLOR}"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER_COLOR}"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER_COLOR}"/>
      </Borders>
    </Style>
    <Style ss:ID="CellAlt">
      <Font ss:FontName="Montserrat" ss:Color="#111827"/>
      <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER_COLOR}"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER_COLOR}"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER_COLOR}"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER_COLOR}"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(worksheetName)}">
    <Table>
      ${widths
        .map((width) => `<Column ss:AutoFitWidth="1" ss:Width="${width}"/>`)
        .join("")}
      ${createRow(columns, "Header")}
      ${rows
        .map((row, index) => createRow(row, index % 2 === 0 ? "Cell" : "CellAlt"))
        .join("")}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>1</SplitHorizontal>
      <TopRowBottomPane>1</TopRowBottomPane>
      <ActivePane>2</ActivePane>
      <ProtectObjects>False</ProtectObjects>
      <ProtectScenarios>False</ProtectScenarios>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([workbook], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFileName(fileName)}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}
