# prismic-ts-downloader

Fetch content from [Prismic](https://prismic.io/) via GraphQL as TypeScript files.

## Installation

```
yarn add @downpourdigital/prismic-ts-downloader
```
```
npm i --save @downpourdigital/prismic-ts-downloader
```

## Motivations

#### Typed results

Since the results are stored as static TS files, exports are automatically typed.

#### Painless integration of files

Files are downloaded and imported, as you would do normally, which means webpack loaders work out of the box!

#### Tool agnostic

`prismic-ts-downloader` isn't tied to a specific site generator or framework. It just puts static files in a folder. Thats it.

## Usage
To get started, you have to provide a site id (`YOUR-SITE-ID`.prismic.io) and an output directory into which the content is downloaded.

`tasks` specifies a list of tasks to run, once the API is ready where a "task" is a function which returns a Promise. (this type is exported as `TaskFactory` for convenience)

Inside this function you have access to several helpers:

`query` runs a query against the API and returns a Promise resolving with the results.

`asExternal` flags a given url for download.

`toFile` writes the given output to a file and adds all the necessary imports.


```typescript
import path from 'path';
import gql from 'graphql-tag';
import { run } from '@downpourdigital/prismic-ts-download';

run({
	siteId: 'YOUR-SITE-ID',
	outDir: path.resolve( __dirname, '../content' ),
	tasks: [
		({ query, asExternal, toFile }) => (
			query({
				query: gql`
				{
					allArticles(lang: "en-us") {
						edges {
							node {
								title
								header_image
								description
							}
						}
					}
				}
				`,
			}).then( response => {
				const output = response.data.allArticles.edges.map(
					({ node }: any ) => ({
						title: node.title[0].text,
						header_image: asExternal( node.header_image.url ),
						description: node.description.map(
							( p: any ) => p.text,
						).join( '\n' ),
					}),
				);

				toFile( 'articles', output );
			})
		),
	],
});

```
To integrate this into your existing build workflow, simply create a separate npm task which runs before the build task. You can run TS files directly with [ts-node](https://www.npmjs.com/package/ts-node).

Inside your project you can now access the content like so:

```typescript
import articles from '../your-specified-dir/articles';

console.log(articles);
// the type of articles is:
{
	title: string,
	header_image: string, // or whatever your image loader outputs
	description: string,
}[]

```

## To do

- error handling
- private repositories
- better docs
- testing



## License
© 2020 [DOWNPOUR DIGITAL](https://downpour.digital), licensed under BSD-4-Clause