import {expect, test, describe} from '@jest/globals'

describe('AB# work item regex pattern', () => {
  test('matches AB# followed by digits', () => {
    const description = 'This PR fixes AB#12345'
    const match = description.match(/AB#(\d+)/g)
    expect(match).not.toBeNull()
    expect(match).toHaveLength(1)
    expect(match![0]).toBe('AB#12345')
    
    const workItemId = match![0].substring(3)
    expect(workItemId).toBe('12345')
    expect(/^\d+$/.test(workItemId)).toBe(true)
  })

  test('matches AB# followed by digits with newline after', () => {
    const description = 'This PR fixes AB#12345\nSome other text'
    const match = description.match(/AB#(\d+)/g)
    expect(match).not.toBeNull()
    expect(match).toHaveLength(1)
    expect(match![0]).toBe('AB#12345')
    
    const workItemId = match![0].substring(3)
    expect(workItemId).toBe('12345')
    expect(/^\d+$/.test(workItemId)).toBe(true)
  })

  test('matches AB# at end of line', () => {
    const description = 'This PR fixes AB#12345\n\nAdditional description here'
    const match = description.match(/AB#(\d+)/g)
    expect(match).not.toBeNull()
    expect(match).toHaveLength(1)
    expect(match![0]).toBe('AB#12345')
    
    const workItemId = match![0].substring(3)
    expect(workItemId).toBe('12345')
    expect(/^\d+$/.test(workItemId)).toBe(true)
  })

  test('does not match AB# with non-digit characters', () => {
    const description = 'This PR fixes AB#abc123'
    const match = description.match(/AB#(\d+)/g)
    expect(match).toBeNull()
  })

  test('matches multiple AB# references', () => {
    const description = 'This PR fixes AB#12345 and AB#67890'
    const match = description.match(/AB#(\d+)/g)
    expect(match).not.toBeNull()
    expect(match).toHaveLength(2)
    expect(match![0]).toBe('AB#12345')
    expect(match![1]).toBe('AB#67890')
  })

  test('OLD REGEX: demonstrates the newline bug', () => {
    const description = 'This PR fixes AB#12345\nSome other text'
    const oldMatch = description.match(/AB#([^ \]]+)/g)
    expect(oldMatch).not.toBeNull()
    
    // This demonstrates the bug - the match includes the newline
    const workItemId = oldMatch![0].substring(3)
    // The old regex would include "12345\nSome" in the match
    expect(workItemId).toContain('12345')
    // And it would fail the integer check because of the newline
    expect(/^\d+$/.test(workItemId)).toBe(false)
  })
})
