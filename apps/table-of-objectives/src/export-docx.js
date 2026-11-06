import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  Tab,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const numbered = (id, text) =>
  new Paragraph({ style: 'Hanging', children: [new TextRun({ children: [String(id), new Tab(), text] })] });

const centered = (text) => new Paragraph({ alignment: AlignmentType.CENTER, text });

const cell = (paragraph, options = {}) => new TableCell({ children: [paragraph], ...options });

export function exportToDocx(title, description, glos) {
  const header = new TableRow({
    tableHeader: true,
    children: ['General Learning Objective', 'Specific Learning Objective', 'Knowledge Dimension', 'Cognitive Process'].map(
      (text) => cell(new Paragraph({ style: 'TableHeader', text }))
    ),
  });

  const rows = glos.flatMap((glo) =>
    glo.slos.map(
      (slo, j) =>
        new TableRow({
          children: [
            // The GLO cell spans all of its SLO rows.
            ...(j === 0 ? [cell(numbered(glo.id, glo.description), { rowSpan: glo.slos.length })] : []),
            cell(numbered(slo.id, slo.description)),
            cell(centered(capitalize(slo.knowledge))),
            cell(centered(capitalize(slo.cognitive))),
          ],
        })
    )
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
      paragraphStyles: [
        {
          id: 'Hanging',
          name: 'Hanging',
          basedOn: 'Normal',
          paragraph: { indent: { left: 1080, hanging: 720 } },
        },
        {
          id: 'TableHeader',
          name: 'Table Header',
          basedOn: 'Normal',
          run: { bold: true },
          paragraph: { alignment: AlignmentType.CENTER },
        },
      ],
    },
    sections: [
      {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 360 } }),
          new Paragraph({ text: 'Course Description', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: description, spacing: { after: 360 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [3600, 5040, 1800, 1800],
            rows: [header, ...rows],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
