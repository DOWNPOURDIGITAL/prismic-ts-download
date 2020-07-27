import ora from 'ora';
import chalk from 'chalk';
import { performance } from 'perf_hooks';
import ApiClient from './ApiClient';

export type TaskFactory = ( utils: {
	query: ApiClient['query'];
	asExternal: ApiClient['track'];
	asComponent: ApiClient['trackComponent'];
	toFile: ApiClient['write'];
}) => Promise<unknown>;

export default function run(
	{ siteId, outDir, tasks }: {
		siteId: string;
		outDir: string;
		tasks: TaskFactory[];
	},
): Promise<unknown> {
	const startTime = performance.now();

	console.log( chalk.dim( `fetching content from ${chalk.reset( `${siteId}.prismic.io` )}` ) );
	console.log( chalk.dim( `to ${outDir}` ) );

	const spinner = ora({
		text: 'updating schema',
		color: 'blue',
		spinner: 'triangle',
	}).start();

	const client = new ApiClient({ siteId, outDir });
	client.apiPromise.then( () => {
		spinner.text = `running ${tasks.length} queries`;
	});

	let doneQueries = 0;
	let imports = 0;

	const promise = Promise.all( tasks.map( f => f({
		query: ( a ) => {
			const p = client.query( a );
			p.then( () => {
				doneQueries += 1;
				spinner.text = `running query ${doneQueries}/${tasks.length}`;
			});
			return p;
		},
		asExternal: ( a ) => {
			imports += 1;
			return client.track( a );
		},
		asComponent: ( a ) => client.trackComponent( a ),
		toFile: ( a, b ) => client.write( a, b ),
	}) ) );

	promise.finally( () => {
		spinner.text = `downloading ${client.files.size} files`;
		client.downloadAll().then( () => {
			spinner.succeed(
				`Done! ${chalk.dim( `(${
					tasks.length
				} queries, ${
					client.files.size
				} files, ${
					imports
				} imports) in ${
					Math.round( ( performance.now() - startTime ) / 10 ) / 100
				}s` )}`,
			);
		});
	});

	return promise;
}
