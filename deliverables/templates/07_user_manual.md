# User Manual — [Program Name]

[One-paragraph description: what the program shows, from which source, and for whom.]

- **Program**: `[PROGRAM]` ([report type]) · **Package**: `[PACKAGE]` ([local/transportable note])
- **System**: `[SID]`, client `[CLIENT]` · **Access**: [read-only | read-write]
- **Requirement folder**: [REQ-NNN](../index.md) · Technical design: [02_technical_design.md](02_technical_design.md)
- **Korean version**: [07_user_manual_ko.md](07_user_manual_ko.md) <!-- omit this line for KO template -->

## 1. Running the program

1. [Log-on prerequisite, e.g. client]
2. [Transaction, e.g. `SE38` / `SA38`]
3. [Program name and Execute (F8)]

[What appears first — e.g. the selection screen.]

## 2. Selection screen

| Field | Meaning | Default | Examples |
|---|---|---|---|
| `[FIELD 1]` | | | |
| `[FIELD 2]` | | | |
| `[FIELD N]` | | | |

Notes:

- [Defaults and how to override them]
- [Data range caveats, e.g. demo data periods]
- [Formatting conventions, e.g. uppercase codes]

## 3. Result list

[What one row represents.]

| Column | Description |
|---|---|
| `[COLUMN 1]` | |
| `[COLUMN N]` | |

[Toolbar capabilities and any column behavior notes, e.g. currency reference.]

## 4. Messages

| Message | Meaning | What to do |
|---|---|---|
| `[MESSAGE TEXT]` | | |

## 5. Technical facts

- [Processing limits, e.g. row cap, sort order]
- [Data access mode, e.g. reads only, never writes]
- [Object lifetime notes, e.g. `$TMP` volatility / recovery copy]
