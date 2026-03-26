import { describe, it, expect } from 'vitest'
import {
  fakeEmail,
  emailToUsername,
  getCategoryDef,
  ALL_CATEGORIES,
  MULTIPLY_CATEGORIES,
  PLUS_CATEGORIES,
  MINUS_CATEGORIES,
  DIVIDE_CATEGORIES,
  TEN_FRIENDS_CATEGORY_ID,
  EASY_CATEGORY_IDS,
  FAKE_EMAIL_DOMAIN,
} from './constants'

describe('fakeEmail', () => {
  it('builds correct email from username', () => {
    expect(fakeEmail('alice')).toBe(`alice@${FAKE_EMAIL_DOMAIN}`)
  })

  it('handles empty username', () => {
    expect(fakeEmail('')).toBe(`@${FAKE_EMAIL_DOMAIN}`)
  })
})

describe('emailToUsername', () => {
  it('extracts username from valid fake email', () => {
    expect(emailToUsername('bob@matte.kort')).toBe('bob')
  })

  it('returns null for wrong domain', () => {
    expect(emailToUsername('bob@gmail.com')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(emailToUsername(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(emailToUsername(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(emailToUsername('')).toBeNull()
  })
})

describe('getCategoryDef', () => {
  it('returns correct category for a multiply ID', () => {
    const cat = getCategoryDef(1)
    expect(cat).toBeDefined()
    expect(cat!.operation).toBe('multiply')
    expect(cat!.id).toBe(1)
  })

  it('returns correct category for a plus ID', () => {
    const cat = getCategoryDef(11)
    expect(cat).toBeDefined()
    expect(cat!.operation).toBe('add')
    expect(cat!.id).toBe(11)
  })

  it('returns correct category for a minus ID', () => {
    const cat = getCategoryDef(21)
    expect(cat).toBeDefined()
    expect(cat!.operation).toBe('subtract')
    expect(cat!.id).toBe(21)
  })

  it('returns undefined for invalid ID', () => {
    expect(getCategoryDef(999)).toBeUndefined()
  })
})

describe('ALL_CATEGORIES', () => {
  it('has the expected total count (multiply + plus + minus + divide)', () => {
    expect(ALL_CATEGORIES).toHaveLength(
      MULTIPLY_CATEGORIES.length + PLUS_CATEGORIES.length + MINUS_CATEGORIES.length + DIVIDE_CATEGORIES.length,
    )
  })

  it('has all unique IDs', () => {
    const ids = ALL_CATEGORIES.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('MULTIPLY_CATEGORIES', () => {
  it('has 10 categories with IDs 1–10', () => {
    expect(MULTIPLY_CATEGORIES).toHaveLength(10)
    const ids = MULTIPLY_CATEGORIES.map(c => c.id)
    expect(ids).toEqual(Array.from({ length: 10 }, (_, i) => i + 1))
  })

  it('each has operation multiply, emoji, and color', () => {
    for (const cat of MULTIPLY_CATEGORIES) {
      expect(cat.operation).toBe('multiply')
      expect(cat.emoji).toBeTruthy()
      expect(cat.color).toBeTruthy()
    }
  })
})

describe('PLUS_CATEGORIES', () => {
  it('each has operation add and a generateEquations function', () => {
    for (const cat of PLUS_CATEGORIES) {
      expect(cat.operation).toBe('add')
      expect(typeof cat.generateEquations).toBe('function')
    }
  })
})

describe('MINUS_CATEGORIES', () => {
  it('each has operation subtract and a generateEquations function', () => {
    for (const cat of MINUS_CATEGORIES) {
      expect(cat.operation).toBe('subtract')
      expect(typeof cat.generateEquations).toBe('function')
    }
  })
})

describe('generateEquations invariants', () => {
  for (const cat of [...PLUS_CATEGORIES, ...MINUS_CATEGORIES]) {
    describe(cat.label, () => {
      it('returns exactly 10 items with numeric a and b', () => {
        const eqs = cat.generateEquations!()
        expect(eqs).toHaveLength(10)
        for (const eq of eqs) {
          expect(typeof eq.a).toBe('number')
          expect(typeof eq.b).toBe('number')
        }
      })

      if (cat.operation === 'add') {
        it('each equation has a + b > 0', () => {
          const eqs = cat.generateEquations!()
          for (const eq of eqs) {
            expect(eq.a + eq.b).toBeGreaterThan(0)
          }
        })
      }

      if (cat.operation === 'subtract') {
        it('each equation has a > b (a - b >= 0)', () => {
          const eqs = cat.generateEquations!()
          for (const eq of eqs) {
            expect(eq.a - eq.b).toBeGreaterThanOrEqual(0)
          }
        })
      }
    })
  }
})

describe('TEN_FRIENDS_CATEGORY_ID', () => {
  it('is 12', () => {
    expect(TEN_FRIENDS_CATEGORY_ID).toBe(12)
  })

  it('getCategoryDef(12) returns the Tiokompisar category', () => {
    const cat = getCategoryDef(TEN_FRIENDS_CATEGORY_ID)
    expect(cat).toBeDefined()
    expect(cat!.label).toBe('Tiokompisar')
    expect(cat!.operation).toBe('add')
  })
})

describe('DIVIDE_CATEGORIES', () => {
  it('has 5 categories', () => {
    expect(DIVIDE_CATEGORIES).toHaveLength(5)
  })

  it('each has operation divide, emoji, color, and generateEquations', () => {
    for (const cat of DIVIDE_CATEGORIES) {
      expect(cat.operation).toBe('divide')
      expect(cat.emoji).toBeTruthy()
      expect(cat.color).toBeTruthy()
      expect(typeof cat.generateEquations).toBe('function')
    }
  })

  it('has IDs 31, 32, 33, 34', () => {
    const ids = DIVIDE_CATEGORIES.map(c => c.id)
    expect(ids).toEqual(expect.arrayContaining([31, 32, 33, 34]))
  })
})

describe('getCategoryDef (divide)', () => {
  it('returns a divide category for id 31', () => {
    const cat = getCategoryDef(31)
    expect(cat).toBeDefined()
    expect(cat!.operation).toBe('divide')
    expect(cat!.id).toBe(31)
  })

  it('returns divide categories for all divide IDs', () => {
    for (const id of [31, 32, 33, 34]) {
      const cat = getCategoryDef(id)
      expect(cat).toBeDefined()
      expect(cat!.operation).toBe('divide')
    }
  })
})

describe('generateEquations invariants (divide)', () => {
  for (const cat of DIVIDE_CATEGORIES) {
    describe(cat.label, () => {
      it('returns exactly 10 items with numeric a and b', () => {
        const eqs = cat.generateEquations!()
        expect(eqs).toHaveLength(10)
        for (const eq of eqs) {
          expect(typeof eq.a).toBe('number')
          expect(typeof eq.b).toBe('number')
        }
      })

      it('each equation has no remainder (a % b === 0)', () => {
        const eqs = cat.generateEquations!()
        for (const eq of eqs) {
          expect(eq.a % eq.b).toBe(0)
        }
      })

      it('all equations use the same non-zero divisor', () => {
        const eqs = cat.generateEquations!()
        const divisor = eqs[0].b
        expect(divisor).toBeGreaterThan(0)
        for (const eq of eqs) {
          expect(eq.b).toBe(divisor)
        }
      })

      it('produces 10 distinct dividend values', () => {
        const eqs = cat.generateEquations!()
        const dividends = eqs.map(e => e.a)
        expect(new Set(dividends).size).toBe(10)
      })
    })
  }
})

describe('EASY_CATEGORY_IDS', () => {
  it('contains id 1 (table 1, the easiest multiply table)', () => {
    expect(EASY_CATEGORY_IDS.has(1)).toBe(true)
  })

  it('contains id 10 (table 10, easy multiply table)', () => {
    expect(EASY_CATEGORY_IDS.has(10)).toBe(true)
  })

  it('contains TEN_FRIENDS_CATEGORY_ID', () => {
    expect(EASY_CATEGORY_IDS.has(TEN_FRIENDS_CATEGORY_ID)).toBe(true)
  })

  it('does not contain mid-range multiply tables (2–9)', () => {
    for (const id of [2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(EASY_CATEGORY_IDS.has(id)).toBe(false)
    }
  })

  it('does not contain subtract or divide category IDs', () => {
    for (const id of [21, 22, 23, 31, 32, 33, 34]) {
      expect(EASY_CATEGORY_IDS.has(id)).toBe(false)
    }
  })
})
