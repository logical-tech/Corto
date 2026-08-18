# Translation coverage

English is the source locale and the fallback for missing text. A language is complete only when every key from the English namespace exists and is translated.

| Language            | Locale | common | dashboard | links | settings | apiKeys |  auth |  docs | landing |   Total | Coverage |
| ------------------- | ------ | -----: | --------: | ----: | -------: | ------: | ----: | ----: | ------: | ------: | -------: |
| English             | `en`   |  53/53 |     13/13 | 89/89 |  110/110 |   26/26 | 28/28 | 39/39 |   31/31 | 389/389 |     100% |
| Italian             | `it`   |  53/53 |     13/13 | 89/89 |  110/110 |   26/26 | 28/28 | 39/39 |   31/31 | 389/389 |     100% |
| French              | `fr`   |  53/53 |     13/13 | 89/89 |  110/110 |   26/26 | 28/28 | 39/39 |   31/31 | 389/389 |     100% |
| German              | `de`   |  53/53 |     13/13 | 89/89 |  110/110 |   26/26 | 28/28 | 39/39 |   31/31 | 389/389 |     100% |
| Spanish             | `es`   |  53/53 |     13/13 | 89/89 |  110/110 |   26/26 | 28/28 | 39/39 |   31/31 | 389/389 |     100% |
| Portuguese          | `pt`   |  53/53 |     13/13 | 89/89 |  110/110 |   26/26 | 28/28 | 39/39 |   31/31 | 389/389 |     100% |
| Chinese, Simplified | `zh`   |  53/53 |     13/13 | 89/89 |  110/110 |   26/26 | 28/28 | 39/39 |   31/31 | 389/389 |     100% |
| Japanese            | `ja`   |  53/53 |     13/13 | 89/89 |  110/110 |   26/26 | 28/28 | 39/39 |   31/31 | 389/389 |     100% |

## Add a language

1. Add the locale code to `locales` in `apps/web/lib/i18n.ts`.
2. Copy `en/*.json` into a new `locales/<locale>/` directory and translate the values.
3. Register that locale's JSON files in `resources` and update this table with the real key counts.
4. Run `bun test apps/web/lib/i18n.test.ts`; it verifies that every namespace has the same keys as English.

Future languages are intentionally not listed until their JSON files exist, so the tracker always reports real coverage rather than a backlog of empty rows.
