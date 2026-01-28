import Link from 'next/link';

export default function WhataboutTestPage() {
    return (
        <main className='p-4'>
            <h1>
                <strong>polytrace</strong>
            </h1>

            <section>
                <p>
                    CLI Tool for Tracing File Accesses via strace. Commands are assumed executed from the root of this
                    README.md.
                </p>
            </section>

            <section>
                <h2>Important</h2>
                <p>
                    polytrace relies on strace which does not run natively on Windows and macOS devices. For development
                    purposes, you can use a Docker container defined by the provided Dockerfile. The performance impact
                    of using containers has not yet been measured or reported.
                </p>
            </section>

            <section>
                <h2>To Build the Container</h2>
                <p>Build and run the development container using Docker:</p>
                <pre className='bg-gray-100 p-3 rounded overflow-auto'>
                    <code>
                        docker build -t polytrace-dev-env . docker run --name polytrace-dev-env -it polytrace-dev-env
                    </code>
                </pre>
            </section>

            <section>
                <h2>To Run the Container</h2>
                <pre className='bg-gray-100 p-3 rounded overflow-auto'>
                    <code>docker start polytrace-dev-env docker exec -it polytrace-dev-env bash</code>
                </pre>
                <p>
                    This gives the user command-line (shell) access to build, test and use the polytrace as described
                    below. Default working directory is set to /PolySim/tools/polytrace.
                </p>
            </section>

            <section>
                <h2>Overview</h2>
                <p>
                    This tool uses make to configure, build, and run tests. We use clang-format for code formatting and
                    clang-tidy for linting.
                </p>
                <pre className='bg-gray-100 p-3 rounded overflow-auto'>
                    <code>make configure make format make build make lint make test</code>
                </pre>
                <p>
                    The build creates two binaries in /build/bin/: - trace: The main tracing tool. - upload: Tool to
                    upload trace results to our server.
                </p>
            </section>

            <section>
                <h2>Usage</h2>
                <p>To trace a program, use the trace binary followed by the command you want to trace. For example:</p>
                <pre className='bg-gray-100 p-3 rounded overflow-auto'>
                    <code>./build/bin/trace ./your_program</code>
                </pre>
                <p>
                    It produces a zipped trace file in the current directory. To upload a trace file, use the upload
                    binary (just for local tests yet). The uploader accepts either a .zip produced by trace (containing
                    prov_upload_input.json) or a standalone .json file with the same payload shape.
                </p>
                Upload a zip created by the trace tool
                <pre className='bg-gray-100 p-3 rounded overflow-auto'>./build/bin/upload path/to/trace.zip</pre>
                Or upload a JSON file directly
                <pre className='bg-gray-100 p-3 rounded overflow-auto'>
                    ./build/bin/upload path/to/prov_upload_input.json{' '}
                </pre>
            </section>

            <Link href='/whatabout' className='text-blue-600'>
                Zurück zu Whatabout
            </Link>
        </main>
    );
}
