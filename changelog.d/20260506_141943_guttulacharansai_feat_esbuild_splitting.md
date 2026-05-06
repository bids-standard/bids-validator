### Infrastructure

- Code-splitting was enabled in bundle configuration to make the validator more
  friendly to load in the browser or include in downstream bundled applications.
  The initial validator load transfers less than 400kB and
  only loads an additional 1.2MB if HED validation is required.
