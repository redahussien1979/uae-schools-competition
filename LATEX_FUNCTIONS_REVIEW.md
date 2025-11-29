# LaTeX Functions Review & Analysis

## Current Implementation

### 1. `convertToLatex(fieldId)` - Lines 1327-1489

**Purpose:** Convert plain text math to LaTeX syntax + auto-wrap

**What it does:**
- Converts expressions: `3/4` → `\frac{3}{4}`, `sqrt(25)` → `\sqrt{25}`
- Converts symbols: `*` → `\times`, `÷` → `\div`, `>=` → `\geq`
- **Auto-wraps** converted expressions in `$...$` (except correctAnswer field)
- Special handling for correctAnswer field (converts but doesn't wrap)

**Example:**
```
Input:  "What is 3/4 of 100?"
Output: "What is $\frac{3}{4}$ of $100$?"
```

---

### 2. `wrapInLatex(fieldId)` - Lines 1494-1521

**Purpose:** Wrap text in LaTeX delimiters only (no conversion)

**What it does:**
- Wraps selected text OR entire content in `\(...\)`
- Does **NO conversion** - just adds delimiters
- Used for correctAnswer field after conversion

**Example:**
```
Input:  "\frac{3}{4}"  (selected)
Output: "\(\frac{3}{4}\)"
```

---

## Key Differences

| Feature | convertToLatex | wrapInLatex |
|---------|---------------|-------------|
| **Conversions** | ✅ Yes (fractions, operators, etc.) | ❌ No |
| **Auto-wrap** | ✅ Yes (except correctAnswer) | ✅ Yes (manual trigger) |
| **Delimiter** | `$...$` | `\(...\)` |
| **Selection support** | ❌ No (whole field) | ✅ Yes |
| **Use case** | Convert plain text to LaTeX | Wrap already-converted LaTeX |

---

## Issues Found

### 🔴 Issue 1: Inconsistent Delimiters
- `convertToLatex` uses `$...$`
- `wrapInLatex` uses `\(...\)`
- **Both should use the same delimiter!**

### 🔴 Issue 2: Double-Wrapping Risk
```javascript
// User clicks "Convert to LaTeX" → wraps in $...$
// Then clicks "Wrap in LaTeX" → wraps again: \($...$\)
// Result: \($\frac{3}{4}$\)  ← DOUBLE WRAPPED!
```

### 🔴 Issue 3: No Unwrap Function
- Once wrapped, user can't easily remove delimiters
- Manual deletion is error-prone

### 🔴 Issue 4: Confusing Workflow
- correctAnswer field: Convert → then Wrap (2 steps)
- Other fields: Convert → auto-wrapped (1 step)
- **Why different behavior?**

### 🔴 Issue 5: Complex Auto-Wrap Logic
- Lines 1433-1481 have 7+ regex patterns for auto-wrapping
- Hard to maintain and debug
- May miss edge cases or over-wrap

---

## Recommended Improvements

### ✅ Improvement 1: Unify Delimiters

**Change `wrapInLatex` to use `$...$`:**

```javascript
// Before:
field.value = before + '\\(' + selectedText + '\\)' + after;

// After:
field.value = before + '$' + selectedText + '$' + after;
```

**Or change `convertToLatex` to use `\(...\)`** - but `$...$` is more common.

---

### ✅ Improvement 2: Add Unwrap Function

```javascript
function unwrapLatex(fieldId) {
    const field = document.getElementById(fieldId);
    let text = field.value;

    // Remove all LaTeX delimiters
    text = text.replace(/\\\(/g, '').replace(/\\\)/g, '');  // \( and \)
    text = text.replace(/\$/g, '');  // $

    field.value = text;
    showToast('Removed LaTeX delimiters', 'success');
}
```

---

### ✅ Improvement 3: Prevent Double-Wrapping

```javascript
function wrapInLatex(fieldId) {
    const field = document.getElementById(fieldId);
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selectedText = field.value.substring(start, end);

    if (selectedText) {
        // ✅ Check if already wrapped
        const before = field.value.substring(0, start);
        const after = field.value.substring(end);

        if (before.endsWith('$') && after.startsWith('$')) {
            showToast('Text is already wrapped in LaTeX delimiters', 'warning');
            return;
        }

        field.value = before + '$' + selectedText + '$' + after;
        field.selectionStart = start + 1;
        field.selectionEnd = end + 1;
    } else {
        // Wrap entire content
        if (field.value.trim()) {
            // ✅ Check if already wrapped
            if (field.value.startsWith('$') && field.value.endsWith('$')) {
                showToast('Text is already wrapped in LaTeX delimiters', 'warning');
                return;
            }

            field.value = '$' + field.value + '$';
        } else {
            alert('Please enter some text or select text to wrap');
            return;
        }
    }

    field.focus();
    showToast('Wrapped in LaTeX delimiters', 'success');
}
```

---

### ✅ Improvement 4: Simplify correctAnswer Handling

**Remove special handling** - always convert AND wrap:

```javascript
// In convertToLatex(), REMOVE lines 1426-1431:
// if (isCorrectAnswerField) {
//     field.value = text;
//     showToast('Converted to LaTeX format (use Wrap button to add delimiters)', 'success');
//     return;
// }

// ✅ Always wrap after conversion for consistency
```

**Or keep separate but make it clear in UI:**
- Button 1: "Convert Only" (no wrap)
- Button 2: "Convert + Wrap" (full conversion)

---

### ✅ Improvement 5: Optimize Auto-Wrap Regex

Combine similar patterns:

```javascript
// Instead of 7+ separate regex replacements, use fewer patterns:

// 1. Wrap ALL math commands in one pass
text = text.replace(
    /(?<!\$)(\\(?:frac|sqrt|times|div|pm|leq|geq|neq|circ|pi|overline|text)\{[^}]+\}(?:\{[^}]+\})?)/g,
    (match) => `$${match}$`
);

// 2. Wrap expressions with operators
text = text.replace(
    /(?<!\$)(-?\d+(?:\.\d+)?(?:\s*[+\-×÷]\s*-?\d+(?:\.\d+)?)+)(?!\$)/g,
    (match) => `$${match}$`
);

// 3. Wrap standalone numbers
text = text.replace(
    /(?<!\$)(?<!\w)(-?\d+(?:\.\d+)?)(?!\w)(?!\$)/g,
    (match) => `$${match}$`
);
```

---

## Proposed Improved Implementation

Here's a cleaner version with all improvements:

```javascript
/**
 * Convert plain text math to LaTeX syntax and wrap in delimiters
 */
function convertToLatex(fieldId, autoWrap = true) {
    const field = document.getElementById(fieldId);
    let text = field.value;

    if (!text.trim()) {
        alert('Please enter some text first');
        return;
    }

    const originalText = text;

    // Apply all conversions (same as before)
    const conversions = [
        [/(-?\d+)\/(\d+)/g, '\\frac{$1}{$2}'],
        [/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}'],
        [/\*/g, '\\times'],
        [/÷/g, '\\div'],
        // ... all other conversions
    ];

    conversions.forEach(([pattern, replacement]) => {
        text = text.replace(pattern, replacement);
    });

    // Check if conversions happened
    if (text === originalText) {
        showToast('No mathematical expressions found', 'info');
        return;
    }

    // Auto-wrap if requested
    if (autoWrap) {
        text = wrapMathExpressions(text);
    }

    field.value = text;
    showToast(autoWrap ? 'Converted and wrapped' : 'Converted (not wrapped)', 'success');
}

/**
 * Wrap text in LaTeX delimiters (with double-wrap prevention)
 */
function wrapInLatex(fieldId) {
    const field = document.getElementById(fieldId);
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selectedText = field.value.substring(start, end);

    if (selectedText) {
        const before = field.value.substring(0, start);
        const after = field.value.substring(end);

        // Prevent double-wrapping
        if (before.endsWith('$') && after.startsWith('$')) {
            showToast('Already wrapped', 'warning');
            return;
        }

        field.value = before + '$' + selectedText + '$' + after;
        field.selectionStart = start + 1;
        field.selectionEnd = end + 1;
    } else {
        if (!field.value.trim()) {
            alert('Please enter text first');
            return;
        }

        // Prevent double-wrapping
        if (field.value.startsWith('$') && field.value.endsWith('$')) {
            showToast('Already wrapped', 'warning');
            return;
        }

        field.value = '$' + field.value + '$';
    }

    field.focus();
    showToast('Wrapped in LaTeX delimiters', 'success');
}

/**
 * Remove LaTeX delimiters from text
 */
function unwrapLatex(fieldId) {
    const field = document.getElementById(fieldId);
    let text = field.value;

    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\)')) {
        showToast('No LaTeX delimiters found', 'info');
        return;
    }

    // Remove all delimiters
    text = text.replace(/\$/g, '');
    text = text.replace(/\\\(/g, '').replace(/\\\)/g, '');

    field.value = text;
    showToast('Removed LaTeX delimiters', 'success');
}

/**
 * Helper: Wrap math expressions intelligently
 */
function wrapMathExpressions(text) {
    // Wrap LaTeX commands
    text = text.replace(
        /(?<!\$)(\\(?:frac|sqrt|times|div|pm|leq|geq|neq|circ|pi|overline|text)\{[^}]+\}(?:\{[^}]+\})?)/g,
        '$$$1$$'
    );

    // Wrap expressions with operators
    text = text.replace(
        /(?<!\$)(-?\d+(?:\.\d+)?(?:\s*[+\-×÷\\times\\div]\s*-?\d+(?:\.\d+)?)+)(?!\$)/g,
        '$$$1$$'
    );

    // Wrap standalone numbers
    text = text.replace(
        /(?<!\$)(?<!\w)(?<!\{)(-?\d+(?:\.\d+)?)(?!\})(?!\w)(?!\$)/g,
        '$$$1$$'
    );

    return text;
}
```

---

## Summary

### Current Issues:
1. ❌ Inconsistent delimiters (`$...$` vs `\(...\)`)
2. ❌ Risk of double-wrapping
3. ❌ No unwrap functionality
4. ❌ Confusing correctAnswer workflow
5. ❌ Complex auto-wrap logic

### Recommended Changes:
1. ✅ Unify to `$...$` delimiters everywhere
2. ✅ Add double-wrap prevention
3. ✅ Add `unwrapLatex()` function
4. ✅ Simplify correctAnswer handling
5. ✅ Refactor auto-wrap into separate helper function

### Benefits:
- More predictable behavior
- Easier to maintain
- Better user experience
- No more accidental double-wrapping
- Ability to undo wrapping
