# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- added setting to debounce messages from custom editor to not spam undo history

## [0.3.0] 2025-12-13

### Added

- added scene dock

- made node colours configurable via `nodeColors` setting
- made node editor use VS Code editor theme colours

### Fixed

- arrange children button now saves state correctly on first press

## [0.2.0] 2025-12-08

### Added

- added minimap
- added arrange children button to scene node

### Changed

- text areas now resize automatically

### Fixed

- create scene button cannot create a scene with a blank id

## [0.1.1] 2025-12-07

No user facing changes.

The extension is now automatically published through a GitHub workflow.

## [0.1.0] 2025-12-07

### Added

- added edges
- added create scene button
- added delete scene button

### Fixed

- button index swapping correctly persists on state

## [0.0.2] 2025-12-06

### Fixed

- editor state persists over defocusing

## [0.0.1] 2025-12-05

Early node editor release
