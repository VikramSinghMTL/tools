import { describe, expect, it } from 'vitest';
import { verifyTable } from './verify.js';

const slo = (id, description, knowledge = 'conceptual', cognitive = 'understand') => ({ id, description, knowledge, cognitive });
const glo = (id, description, slos) => ({ id, description, slos });
const table = (...glos) => ({ glos });

const run = (t, options) => verifyTable(t, options);
const codes = (result, label) =>
  result.notes.filter((n) => label === undefined || n.label === label).map((n) => n.code).sort();

describe('every check runs every time', () => {
  it('checks the SLOs of a blank GLO', () => {
    const r = run(table(glo(1, '', [slo('1.1', 'Students explain things.'), slo('1.2', 'List the parts.')])));
    expect(codes(r, '1')).toContain('blank');
    expect(codes(r, '1.1')).toContain('not-verb');
  });

  it('checks the SLOs of a GLO that does not start with a verb', () => {
    const r = run(table(glo(1, 'Students will understand X.', [slo('1.1', ''), slo('1.2', 'List X.', 'factual', 'remember')])));
    expect(codes(r, '1')).toContain('not-verb');
    expect(codes(r, '1.1')).toContain('blank');
  });

  it('keeps checking an SLO whose Knowledge Dimension is blank', () => {
    const r = run(table(glo(1, 'Explain X.', [slo('1.1', 'Students list X. And more.', '', 'remember'), slo('1.2', 'List Y.', 'factual', 'remember')])));
    expect(codes(r, '1.1')).toEqual(expect.arrayContaining(['blank-knowledge', 'not-verb', 'sentences']));
  });
});

describe('starts with a verb', () => {
  const first = (description) => codes(run(table(glo(1, description, [slo('1.1', 'List X.', 'factual', 'remember'), slo('1.2', 'List Y.', 'factual', 'remember')]))), '1');

  it.each(['Design a lesson.', 'List the steps.', 'Plan a unit.', 'Calculate the mean.', 'Write an essay.', 'Analyse data.', 'Debug a program.', 'Critique a paper.'])(
    'accepts %s',
    (description) => expect(first(description)).not.toContain('not-verb')
  );

  it.each(['Students will be able to list X.', 'The learner lists X.', 'Criteria for success.', 'What is a cell?', '1. List X.'])(
    'rejects %s',
    (description) => expect(first(description)).toContain('not-verb')
  );

  it('offers the word to accept, and accepting it clears the error', () => {
    const t = table(glo(1, 'Frobnicate the widget.', [slo('1.1', 'List X.', 'factual', 'remember'), slo('1.2', 'List Y.', 'factual', 'remember')]));
    const note = run(t).notes.find((n) => n.code === 'not-verb');
    expect(note.word).toBe('frobnicate');
    expect(note.dismissible).toBe(false);
    expect(codes(run(t, { acceptedVerbs: ['frobnicate'] }), '1')).not.toContain('not-verb');
  });

  it('treats accepted verbs like any other verb', () => {
    const t = table(glo(1, 'Explain X.', [slo('1.1', 'Frobnicate X.', 'factual', 'remember'), slo('1.2', 'List Y.', 'factual', 'remember')]));
    expect(codes(run(t, { acceptedVerbs: ['frobnicate'] }), '1.1')).not.toContain('not-blooms');
    expect(codes(run(t, { acceptedVerbs: [] }), '1.1')).toContain('not-verb');
  });
});

describe('levels', () => {
  const pair = (gloText, sloText, cognitive) =>
    codes(run(table(glo(1, gloText, [slo('1.1', sloText, 'conceptual', cognitive), slo('1.2', 'List Y.', 'factual', 'remember')]))), '1.1');

  it('compares against the highest level of a GLO verb listed at several levels', () => {
    // "Choose" is listed under Remember, Apply, Evaluate and Create.
    expect(pair('Choose an approach.', 'Design a lesson.', 'create')).not.toContain('above-glo');
    // "Define" is Remember only.
    expect(pair('Define the terms.', 'Model the process.', 'apply')).toContain('above-glo');
  });

  it('flags a verb/process mismatch in both directions', () => {
    expect(pair('Choose an approach.', 'Design a lesson.', 'remember')).toContain('verb-mismatch');
    expect(pair('Choose an approach.', 'Define the terms.', 'create')).toContain('verb-mismatch');
    expect(pair('Choose an approach.', 'Define the terms.', 'remember')).not.toContain('verb-mismatch');
  });

  it('treats British spellings like their American level', () => {
    expect(pair('Choose an approach.', 'Analyse the data.', 'analyze')).not.toContain('verb-mismatch');
    expect(pair('Choose an approach.', 'Analyse the data.', 'remember')).toContain('verb-mismatch');
  });
});

describe('wording', () => {
  const messages = (gloText, sloText, cognitive) =>
    run(table(glo(1, gloText, [slo('1.1', sloText, 'conceptual', cognitive), slo('1.2', 'List Y.', 'factual', 'remember')])))
      .notes.filter((n) => n.label === '1.1')
      .map((n) => n.message);

  it('uses "an" before vowels', () => {
    expect(messages('Choose an approach.', 'Situate the event.', 'create')).toContain('“Situate” is an Understand verb, but the Cognitive Process is Create.');
    expect(messages('Choose an approach.', 'Define the terms.', 'create')).toContain('“Define” is a Remember verb, but the Cognitive Process is Create.');
  });

  it('does not repeat a GLO verb that is itself a level name', () => {
    const [aboveGlo] = messages('Understand X.', 'Design a lesson.', 'create');
    expect(aboveGlo).toContain("higher than the GLO's verb (Understand).");
    expect(messages('Explain X.', 'Design a lesson.', 'create')[0]).toContain("higher than the GLO's verb (Explain, Understand / Evaluate).");
  });
});

describe('objective-writing checks', () => {
  const sloCodes = (sloText) =>
    codes(run(table(glo(1, 'Explain X.', [slo('1.1', sloText), slo('1.2', 'List Y.', 'factual', 'remember')]))), '1.1');

  it('flags vague SLO verbs, but not in GLOs', () => {
    expect(sloCodes('Understand the water cycle.')).toContain('vague');
    expect(sloCodes('Understand the water cycle.')).not.toContain('too-general');
    expect(sloCodes('Know the parts of a cell.')).toContain('vague');
    expect(sloCodes('Know the parts of a cell.')).not.toContain('not-blooms');
    const r = run(table(glo(1, 'Understand X.', [slo('1.1', 'List X.', 'factual', 'remember'), slo('1.2', 'List Y.', 'factual', 'remember')])));
    expect(codes(r, '1')).not.toContain('vague');
  });

  it('still flags level names used as SLO verbs', () => {
    expect(sloCodes('Evaluate the options.')).toContain('too-general');
  });

  it('flags two or more actions in one objective', () => {
    expect(sloCodes('Build and explain a model.')).toContain('compound');
    expect(sloCodes('Identify, compare and contrast the theories.')).toContain('compound');
    expect(sloCodes('Compare structure and function.')).not.toContain('compound');
  });

  it('accepts any recognised verb, not just the example verbs', () => {
    expect(sloCodes('Calibrate the instrument.')).toEqual([]);
    expect(sloCodes('Debug the loop.')).toEqual([]);
  });

  it('flags more than one sentence', () => {
    expect(sloCodes('Explain X. Then explain Y.')).toContain('sentences');
  });

  it('hints at a GLO with a single SLO', () => {
    expect(codes(run(table(glo(1, 'Explain X.', [slo('1.1', 'List X.')]))), '1')).toContain('single-slo');
    expect(codes(run(table(glo(1, 'Explain X.', [slo('1.1', 'List X.'), slo('1.2', 'List Y.')]))), '1')).not.toContain('single-slo');
  });

  it('hints when nothing goes beyond Understand', () => {
    const low = table(glo(1, 'Explain X.', [slo('1.1', 'List X.', 'factual', 'remember'), slo('1.2', 'Explain Y.')]));
    expect(codes(run(low), 'Course')).toEqual(['lower-order']);
    const high = table(glo(1, 'Explain X.', [slo('1.1', 'List X.', 'factual', 'remember'), slo('1.2', 'Solve Y.', 'procedural', 'apply')]));
    expect(codes(run(high), 'Course')).toEqual([]);
  });
});

describe('dismissing', () => {
  const t = () => table(glo(1, 'Explain X.', [slo('1.1', 'Build and explain a model.', 'procedural', 'create'), slo('1.2', 'List Y.', 'factual', 'remember')]));

  it('hides a dismissed warning until the objective changes', () => {
    const note = run(t()).notes.find((n) => n.code === 'compound');
    expect(run(t(), { dismissed: [note.key] }).notes.find((n) => n.code === 'compound').dismissed).toBe(true);

    const edited = t();
    edited.glos[0].slos[0].description = 'Build and explain a better model.';
    expect(run(edited, { dismissed: [note.key] }).notes.find((n) => n.code === 'compound').dismissed).toBe(false);
  });

  it('never dismisses errors', () => {
    const blank = table(glo(1, '', [slo('1.1', 'List X.'), slo('1.2', 'List Y.')]));
    const note = run(blank).notes.find((n) => n.code === 'blank');
    expect(run(blank, { dismissed: [note.key] }).notes.find((n) => n.code === 'blank').dismissed).toBe(false);
  });

  it('counts dismissed notes separately', () => {
    const note = run(t()).notes.find((n) => n.code === 'compound');
    const { counts } = run(t(), { dismissed: [note.key] });
    expect(counts.dismissed).toBe(1);
  });
});

describe('overview grid', () => {
  it('counts SLOs by knowledge dimension and cognitive process', () => {
    const { grid } = run(table(glo(1, 'Explain X.', [slo('1.1', 'List X.', 'factual', 'remember'), slo('1.2', 'List Y.', 'factual', 'remember'), slo('1.3', 'Solve Z.', 'procedural', 'apply'), slo('1.4', 'Solve W.', '', 'apply')])));
    expect(grid[0][0]).toBe(2); // factual × remember
    expect(grid[2][2]).toBe(1); // procedural × apply
    expect(grid.flat().reduce((a, b) => a + b)).toBe(3); // blank knowledge is not counted
  });
});

describe('sample course', async () => {
  const { default: sample } = await import('../sample-data.json');
  it('produces the expected notes', () => {
    const r = run(sample);
    expect(r.notes.map((n) => `${n.label} ${n.code}`).sort()).toMatchInlineSnapshot(`
      [
        "1.4 above-glo",
        "1.4 verb-mismatch",
        "2.1 compound",
        "2.1 verb-mismatch",
        "2.2 above-glo",
        "2.2 too-general",
      ]
    `);
  });
});
