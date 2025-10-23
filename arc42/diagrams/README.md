# PlantUML sources for the arc42 documentation

This directory holds PlantUML source files used in the arc42 documentation.

## Files

- `building-blocks.puml` — the canonical component / building-block diagram for the documentation (renamed from `component.puml`).

## Regenerating images

If you need to regenerate rendered images (PNG/SVG), run the PlantUML jar from this directory. Examples:

```bash
# Render all PUML files in the directory and move PNGs to ../images/
java -jar plantuml.jar *.puml && mv *.png ../images/
```

## Notes

You need to have Java installed and provide the PlantUML jar file by yourself.

- Java: https://sdkman.io/install/ (recommended)
- PlantUML: https://plantuml.com/de/download (I never saw a page more overloaded with ads, but that's the official source)
