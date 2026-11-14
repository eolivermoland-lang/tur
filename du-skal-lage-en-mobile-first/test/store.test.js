import test from 'node:test';
import assert from 'node:assert/strict';
import { addTrip, clothingAdvice } from '../src/store.js';

test('addTrip puts a new memory first and keeps the supplied details', () => {
  const trips = addTrip([], {
    place: 'Romsdalen',
    note: 'Rolig kveld ved elva',
    date: '2026-11-14',
    image: 'data:image/png;base64,abc'
  });

  assert.deepEqual(trips, [{
    id: '2026-11-14-Romsdalen',
    place: 'Romsdalen',
    note: 'Rolig kveld ved elva',
    date: '2026-11-14',
    image: 'data:image/png;base64,abc'
  }]);
});

test('clothingAdvice recommends a rain layer for rain', () => {
  assert.match(clothingAdvice({ temperature: 7, rain: true }), /regnjakke/i);
});
