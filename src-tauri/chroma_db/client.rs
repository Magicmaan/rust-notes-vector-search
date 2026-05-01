use std::sync::{Arc, Mutex};

use anyhow::Result;
use chroma::{
    client::ChromaHttpClientError, ChromaCollection, ChromaHttpClient, ChromaHttpClientOptions,
};

pub fn get_client() -> Result<ChromaHttpClient> {
    let options = ChromaHttpClientOptions {
        endpoint: "http://localhost:8000".parse()?,
        ..Default::default()
    };
    let client = ChromaHttpClient::new(options);

    Ok(client)
}

#[derive(Debug)]
#[allow(dead_code)]
pub struct ChromaClient {
    client: Arc<Mutex<ChromaHttpClient>>,
    collections: DatabaseCollections,
}

impl ChromaClient {
    pub async fn new() -> Result<Self> {
        let client = Arc::new(Mutex::new(get_client()?));
        let collections_client = client.clone();
        let collections = DatabaseCollections::new(collections_client).await?;
        Ok(Self {
            client: client,
            collections,
        })
    }
}

#[derive(Debug)]
#[allow(dead_code)]
pub struct DatabaseCollections {
    pub client: Arc<Mutex<ChromaHttpClient>>,
    pub collections: Vec<ChromaCollection>,
}

impl DatabaseCollections {
    pub async fn new(client: Arc<Mutex<ChromaHttpClient>>) -> Result<Self> {
        Ok(Self {
            client,
            collections: vec![],
        })
    }

    pub async fn create_collection(&mut self, name: &str) -> Result<()> {
        let client = self.client.lock().unwrap();
        let collection = client.create_collection(name, None, None).await?;
        self.collections.push(collection);
        Ok(())
    }
    pub async fn list_collections(&mut self) -> Result<Vec<ChromaCollection>> {
        let client = self.client.lock().unwrap();
        let collection_names = client.list_collections(16, None).await?;
        Ok(collection_names)
    }
    pub async fn get_collection(&mut self, name: &str) -> Result<ChromaCollection> {
        let client = self.client.lock().unwrap();
        let collection = client.get_collection(name).await?;
        Ok(collection)
    }
    pub async fn delete_collection(&mut self, name: &str) -> Result<()> {
        let client = self.client.lock().unwrap();
        client.delete_collection(name).await?;
        self.collections.retain(|c| c.name != name);
        Ok(())
    }

    pub async fn update_collection(&mut self, name: &str, new_name: &str) -> Result<()> {
        let collection = self.get_collection(name).await?;

        collection.modify(Some(new_name), {}).await?;
        Ok(())
    }
}
