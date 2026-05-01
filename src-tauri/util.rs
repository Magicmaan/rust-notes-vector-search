pub fn setup_logging(level: log::LevelFilter) {
    use simplelog::{Config, SimpleLogger};

    SimpleLogger::init(level, Config::default()).unwrap();
}
