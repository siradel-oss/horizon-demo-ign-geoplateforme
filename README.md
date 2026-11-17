# IGN Explorer

An experimental **3D explorer of the IGN Géoplateforme open data catalogue**, in
English and French. Browse the catalogues of the French national mapping agency's
public services (aerial imagery, maps, elevation models, vector tiles), add layers
to a 3D globe, reorder and restyle them, search addresses and play with the
lighting.

> **A demonstrator.** IGN Explorer is a demo of
> [Horizon](https://horizon.oss.siradel.com), Siradel's open source geospatial 3D
> engine, which grew out of the [SCE](https://sce.oss.siradel.com) ecosystem.
> It is still an experiment: layers are shown as published, without validation,
> and the rendering may contain small errors.
>
> IGN Explorer is **not an official IGN product**. It is neither affiliated with
> nor endorsed by the Institut national de l'information géographique et
> forestière, and only uses the public services of the Géoplateforme.

## Run it

Requirements: Node.js ≥ 22.12, pnpm 11 (see `packageManager`), and a browser with WebGL 2 and
`SharedArrayBuffer`.

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

| Command        | Description                              |
| -------------- | ---------------------------------------- |
| `pnpm dev`     | Development server                       |
| `pnpm build`   | Type check and static build into `dist/` |
| `pnpm preview` | Serves the build locally                 |
| `pnpm format`  | Formats the sources with Prettier        |

The build uses relative URLs (Vite base `./`), so `dist/` can be served under any
subpath. `?lang=en` or `?lang=fr` forces the interface language.

### Serving requirements

Horizon runs its WASM core across threads, which requires `SharedArrayBuffer`.
The static server must therefore send these headers on every response:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

It must also serve `hrz_core.wasm` as `application/wasm`. The dev and preview
servers already do both (see `vite.config.ts`).

Hosts that cannot set headers, such as GitHub Pages, rely on the bundled
[coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) (MIT), which adds
them client-side. The `.github/workflows/deploy.yml` workflow builds and publishes
the app to GitHub Pages on every push to `main`.

## Stack

- [Horizon](https://horizon.oss.siradel.com): `@siradel-oss/horizon-{api,core,protocol}`
- Vue 3, vue-i18n, Tailwind CSS 4, MiniSearch; Vite and TypeScript

```
src/
├── App.vue           # Horizon canvas, tool rail, windows
├── layout/           # Windows: layers, catalogue, search, lighting, attributions, about
├── components/       # UI primitives
├── service/          # Horizon messages, IGN catalogue and geocoding, layer models
└── locales/          # EN / FR strings
resources/            # Fonts, their licences, compass
```

## Data

No data is bundled: everything is streamed at runtime from public services.

| Source                                                                                             | Content                                      | Licence                                                                                                                              |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [IGN Géoplateforme](https://geoservices.ign.fr/)                                                   | WMTS, WMS and TMS catalogues, address search | Each layer keeps the licence of its producer, mostly [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) |
| [OpenMapTiles](https://openmaptiles.org/) served by the DINUM on data.gouv.fr (not an IGN service) | OpenStreetMap vector tiles                   | © DINUM, © OpenMapTiles, © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL)                              |

The in-app **Attributions** panel lists the credits of the layers on screen.

## License

Code: [MIT](LICENSE). Data keeps the licence of its producer (see above).
Bundled fonts: Source Sans 3 (SIL Open Font License) and Material Symbols
(Apache License 2.0). Their licence files are in `resources/`.

## Contact

Siradel open source: [opensource@siradel.com](mailto:opensource@siradel.com) ·
[www.siradel.com](https://www.siradel.com)
