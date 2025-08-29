import { describe, it, expect } from 'vitest';
import { oldToNew, newToOld } from '../src/convert';
import old from './fixtures/old.json';
import newer from './fixtures/new.json';

describe('Roundtrip', () => {
  it('old → new → old conserva tablas/attrs/posiciones', () => {
    const n = oldToNew(old as any);
    const back = newToOld(n as any);
    expect(back.shapes.length).toBe((old as any).shapes.length);
    for (const s of back.shapes) {
      const orig = (old as any).shapes.find((x:any)=>x.details.id===s.details.id)!;
      expect(s.details.name).toBe(orig.details.name);
      expect(s.details.x).toBe(orig.details.x);
      expect(s.details.y).toBe(orig.details.y);
      expect(s.details.attributes.map((a:any)=>a.id))
        .toEqual(orig.details.attributes.map((a:any)=>a.id));
    }
  });

  it('new → old → new conserva edges y columnas FK', () => {
    const o = newToOld(newer as any);
    const back = oldToNew(o as any);
    expect(back.data.nodes.length).toBe((newer as any).data.nodes.length);
    expect(back.data.edges.length).toBe((newer as any).data.edges.length);
  });
});
