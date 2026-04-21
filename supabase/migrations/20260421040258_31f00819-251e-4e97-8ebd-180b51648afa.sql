UPDATE branches
SET code = TRIM(code),
    state = TRIM(state)
WHERE code <> TRIM(code) OR state <> TRIM(state);