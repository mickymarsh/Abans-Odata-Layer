# Abans OData Layer

## What is OData?

OData (Open Data Protocol) is a standardized, RESTful protocol for querying and manipulating data. It builds on core web technologies such as HTTP, REST, and JSON (or XML) and defines a rich set of query options (for example, `$filter`, `$select`, `$expand`, `$orderby`, and `$top`) that let clients express complex queries in a consistent way. OData makes it easier to expose data models and enables interoperable clients and tooling.

## Purpose of this repository

This repository is created to provide an OData layer that connects our Supabase database to our backend. The goal is to expose data from Supabase in an OData-compliant manner so backend services and clients can query and manipulate the data using standard OData queries.

Key points:
- This project connects to a Supabase (Postgres) database as the primary data store.
- It exposes endpoints that follow OData conventions so clients can use `$filter`, `$select`, `$expand`, etc.
- The backend can consume these endpoints or integrate the OData layer directly into its API stack.

## Getting started (notes)

- Provide Supabase connection configuration (URL, anon/ service key) to the project via environment variables or your configuration system.
- Implement authentication and role-based access control according to your security model when exposing OData endpoints.
- Consider paging and rate-limiting when returning large datasets.


