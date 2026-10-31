# Mobile interaction verification — 2026-10-25

Browser iframe viewports: 360×640, 390×844, 768×1024, 1024×768.

At each size: pending-hold movement preserves target coordinates; 500 ms hold unlocks edit controls; held movement persists new coordinates; pointercancel restores the previous coordinates; tabs stay on one line with horizontal overflow enabled; no page-level horizontal overflow; reload restores saved targets. All seven checks passed at each size. The reload assertion polls for application readiness rather than assuming a fixed load time.

Native browser input at 390×844 also verified short selection, a 650 ms hold, and cancellation of the delete confirmation. Sidebar opening, collapsing and right-control folding were inspected. A 500 m circle was created using the existing tool. Existing 36 core / Slovenia / wind regression tests passed.

The pointer regression harness dispatches touch PointerEvents inside the embedded app. These checks do not substitute for physical device tests or live GPS hardware. OpenStreetMap tiles returned provider access-blocked images in this test browser; external tile imagery could not be verified. No tile-provider changes were made.

To repeat: temporarily copy mobile-interactions.html into dist/ as mobile-qa.html, start the supported Sites preview, open /mobile-qa.html?w=390&h=844, wait for the app, then run the test button. The harness creates test targets in browser-local storage; use a test browser profile. Remove the temporary dist file before publishing.

## 2026-10-25 follow-up

- 360×640: coordinate button opens a modal; GPS coordinate entry creates a target and closes it. Five bottom tools only; six top navigation icons. TDS no longer includes the example section.
- 768×1024: coordinate and pressure modals open; saved pressure/QNH values survive navigation/reload. QNH alone leaves altitude source GPS.
- QNH 1013.25 / station pressure 900 hPa displays 989 m / 3244 ft as manual barometric altitude. Five additional unit tests cover reference values, range validation, stale data and backup validation (41 tests total passed).
- Start/stop SVG, label and aria-pressed transitions verified with a temporary fixture mocking secure context and geolocation. Fixture removed before publishing. Live GPS/barometer hardware not tested.
- GPS track/export and wind altitude source remain GPS; manual pressure is explicitly identified and expires from the main readout after five minutes. Only a new manually entered pressure refreshes its measurement timestamp.
- Formula source: WMO Guide 8 §3.2.2 equations 3.1–3.3, https://www.weather.gov/media/epz/mesonet/CWOP-WMO8.pdf . QNH is an altimeter reference; it does not correct a GPS elevation.

## TargetNav branding / theme verification

Uploaded original PNG logo/icon variants copied into assets without redrawing. Browser title, navigation brand, help branding, install manifest, favicon, export filenames and Site display title now use TargetNav. Existing project URL, manifest start URL and aerostat.plan.v1 persistence key are unchanged.

Browser QA: 360×640 light/dark controls and coordinate dialog; no document-level horizontal overflow. 768×1024 dark sidebar; desktop light/dark toggle and help logo. Theme toggle's accessible label and pressed state update; dark preference and correct icon survive reload. Dialog computed colours in dark mode: background #202226, text #f4f2ec, input #292c31. Existing seven test targets remain after theme switches and reloads. Standard/satellite/offline map imagery and task marker colours are not recoloured by the UI theme. Temporary responsive QA page removed before packaging.

## 1.0.1 target dark-mode regression

Target inspector explicitly uses --surface-low / --ink. Selection toolbar buttons use --surface-raised / --ink; delete uses dark-compatible danger colour. Edit/close use 20 px, 2-unit stroke SVGs and accessible labels. Browser dark computed colours: inspector #181a1d with #f4f2ec text; edit/close #292c31 with #f4f2ec; delete #412b22 with #ffaba0. Sample TDS import UI produces four tasks and six labelled GPS points. All 43 unit tests pass, including extraction from generated PDF text, coordinate/feet conversion and MSL reference. APK packaged core/theme bytes match tested Site files; same signing certificate and increased version code verified. Physical Android update not tested here.

## 1.0.2 PDF import compatibility

Replaced PDF.js modern builds with matching pinned 4.10.38 legacy main/worker bundles. Added font and CMap assets. New PDF loader detects PDF header/MIME in addition to extension, offers FileReader fallback, shows page progress, limits raster size and reports errors. Android uses the bundled PDF.js in-process worker handler so asset requests do not depend on a worker's network interception. No tasks are populated from a cached answer for the Kapadokya test.

Browser QA loaded actual Kapadokya 4/4 PDF bytes, deliberately removed Promise.withResolvers before loading the engine, and successfully extracted four tasks / six goals in both in-process and normal module-worker modes. The probe used an extensionless file metadata object to verify header detection. All 47 Node regression tests pass. This does not emulate the complete Huawei WebView or verify its native file chooser; physical tablet confirmation is pending. To rerun, temporarily copy tests/pdf-compatibility.html to dist/pdf-qa.html and the fixture to dist/pdf-qa-sample.pdf, start supported preview, then click its test button. Remove both before publication.


## Global coordinates · 27 October 2026
- 56 automated checks passed, including both hemispheres, Norway/Svalbard exceptions, 100 km boundaries, ambiguous input, explicit profiles, and saved geometry reference snapshots.
- Browser: SHM-outside 3486/3862 previews and saves under automatic WGS84/UTM36N.
- Sydney GPS displays 3437/5095, WGS84/UTM56S; short input around Sydney resolves within metres.
- Profile switch preserves Sydney GPS -33.8688000,151.2093000 and existing point lists.
- TDS text review previews target and then imports 1 JDG target at 4500 ft, logger1.
- 360px iframe: coordinate preview and confirmation visible; 768px layout retains app controls.
- Live device GPS and physical tablet runtime not exercised. No APK built for this iteration.

## Flight navigation update · 2026-10-27
- Preview at 768×1024 and 360×800 iframe viewports, dark theme. Active target T1 JDG retained when Hedef 1 was inspected; short selection exposes activation, edit/delete remain locked.
- Active summary displayed 3437/5095, task 1 JDG, red marker, logger 1 and 08:00 deadline. 5 minute option and flight view toggle respond.
- Existing local saved targets/tasks loaded unchanged. No real tablet or live GPS feed available; motion gating and heading wrap/smoothing covered by unit tests. OSM tile access denied by provider in test browser; no workaround attempted.
- 60 automated tests pass. Projection uses GPS course/speed and geodesic distance; hides stale (>15 s), inaccurate (>50 m), missing course and slow (<1 m/s) fixes. No altitude/wind prediction.

## Competition map update · 2026-10-30
- Inspected all eight supplied formats. JPG is 2005×2048, MAP calibration 7148×7298. Original NTAMAP contains 365 actual XYZ images (manifest count 377 includes directories), 1098 UTM pyramid images and 4897×5000 master. Original XYZ imagery was shifted/scaled against UTM-calibrated vector data. Bundled XYZ tiles were regenerated from the master and UTM affine calibration; visual comparison now aligns blue boundary and red/yellow PZ circles. Generic original NTAMAP prefers calibrated master reprojection over its prebuilt XYZ.
- PZ Excel Tabelle2: 8 circles; PZ10 has 8000 ft but no coordinate geometry. Its blue boundary is digitized from the raster centerline and explicitly marked approximate (±150 m due to broad stroke), not an official vector boundary. Tabelle1 contains unrelated historical data and is never auto-imported. Eight WPT CLAs retain exact WGS84 positions. Missing altitude reference and yellow-PZ heights remain unknown.
- Browser tested local package preview, IndexedDB save, reload, source-free map rendering after reload, CLA/PZ toggles and persistent preferences. PZ visibility does not disable warning checks. Spreadsheet picker and Tabelle2 preview passed; Tabelle1 is rejected as outside current map scope. Preview cancel leaves active map unchanged.
- 768×1024 and 360×800 views checked, including dark theme. CLA/PZ/targets are direct buttons; map/boundary/grid/launch/drawing/track controls under Other. Existing navigation and bottom drawing tools remain.
- Horizontal PZ warning tests cover fresh/stale/poor GPS, circle/polygon geometry, uncertainty and southern hemisphere conversions. No actual tablet GPS flight or airplane-mode device test performed. Raster's printed markings cannot be independently hidden; turn off raster to use independently controlled vectors.
- OZF4 direct decompression unsupported; import provides actionable NTAMAP or MAP+JPG alternative. MAP supports WGS84/UTM with consistent axis-aligned control points; JGW supports affine rotation with explicit coordinate reference and original image dimensions. Unsupported datums/projections fail explicitly.

## Vector-only import correction · 2026-10-30
- New Kapadokya PZ / CLA action loads a small JSON vector package, not NTAMAP imagery. It contains exact WPT/Excel geometry and the clearly approximate raster-digitized blue boundary. No mapType or image asset is present.
- Existing image-first plans switch off photo once. Supplied Cappadocia MAP/NTAMAP calibration extent is matched numerically (not by filename) so missing CLA/PZ layers can be populated from provided source data. Other countries/extents are untouched. Explicit import enables PZ/CLA, normal/satellite selection disables raster, and photo display is optional in preview.
- Tests cover vector-only package, recognized-map enrichment, retention of custom vectors and refusal to attach Cappadocia data to unrelated maps.

## New blank plan button fix · 2026-10-30
- Replaced the browser confirm dependency with an in-app confirmation dialog, explicit Cancel and Create buttons. Cancel returns to file controls without changing plan data.
- Browser QA created a disposable GPS target. Cancel retained its name/coordinate. Confirm then closed the dialog, showed New blank plan created, returned to Home and displayed zero targets and tasks. Reset also cancels drawing/recording, clears selection and transient previews, and restores the default map view. Offline map databases are not deleted.

## Shared deletion confirmation fix · 2026-10-30
- Replaced remaining browser confirm calls in target/launch/shape deletion, GPS-track clear, backup restore, archived-plan restore and race-layer removal with a separate app-owned modal. The nested confirmation does not replace or prematurely close the point/shape editor. Escape, close and Cancel resolve false; only the explicit action resolves true.
- Browser QA: created a disposable target with a 250 m circle. Cancel kept target. Confirm removed target and linked circle. Undo restored both; Layers displayed 1 geometry / 1 target. New blank plan cancellation/confirmation also passed in this session.
