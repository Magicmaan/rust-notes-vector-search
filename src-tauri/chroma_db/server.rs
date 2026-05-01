use anyhow::{Context, Result};
use chroma::{ChromaHttpClient, ChromaHttpClientOptions};
use log::{error, trace};
use std::io::ErrorKind;
use std::process::Command;

fn has_chroma() -> bool {
    Command::new("chroma")
        .arg("--version")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

// Starts the chroma server
pub fn run_server() -> Result<()> {
    if !has_chroma() {
        println!("Chroma is not installed. Please install it to run the server.");
        return Err(anyhow::anyhow!("Chroma is not installed"));
    }

    match Command::new("chroma").spawn() {
        Ok(_) => {
            trace!("Chroma server started successfully");
        }
        Err(e) => {
            if ErrorKind::NotFound == e.kind() {
                // This shouldn't happen because we check for chroma before, but just in case
                error!("Chroma is not installed. Please install it to run the server.");
            } else {
                error!("Failed to start Chroma server: {}", e);
            }
            return Err(e.into());
        }
    };

    Ok(())
}

pub fn get_client() -> Result<()> {
    let options = ChromaHttpClientOptions {
        endpoint: "http://localhost:8000".parse()?,
        ..Default::default()
    };
    let client = ChromaHttpClient::new(options);

    Ok(())
}

#[cfg(test)]
pub mod tests {
    use crate::server::run_server;

    #[test]
    fn test_has_chroma() {
        assert!(super::has_chroma());
    }

    #[test]
    fn test_run_server() {
        // util::setup_logging(log::LevelFilter::Trace);
        run_server().unwrap_or_else(|e| {
            panic!("Failed to run server: {}", e);
        });
    }
}
