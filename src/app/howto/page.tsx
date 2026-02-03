import { Page } from '@/components/client/Page';
import { Card } from '@/components/ui/card';

export default function HowToPage() {
    return (
        <Page title='How To'>
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
                <Card className='w-full'>
                    docker build -t polytrace-dev-env . docker run --name polytrace-dev-env -it polytrace-dev-env
                </Card>
            </section>

            <section>
                <h2>To Run the Container</h2>
                <Card className='w-full'>docker start polytrace-dev-env docker exec -it polytrace-dev-env bash</Card>
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
                <Card className='w-full '>make configure make format make build make lint make test</Card>
                <p>
                    The build creates two binaries in /build/bin/: - trace: The main tracing tool. - upload: Tool to
                    upload trace results to our server.
                </p>
            </section>

            <section>
                <h2>Usage</h2>
                <p>To trace a program, use the trace binary followed by the command you want to trace. For example:</p>
                <Card className='w-full '>./build/bin/trace ./your_program</Card>
                <p>
                    It produces a zipped trace file in the current directory. To upload a trace file, use the upload
                    binary (just for local tests yet). The uploader accepts either a .zip produced by trace (containing
                    prov_upload_input.json) or a standalone .json file with the same payload shape.
                </p>
                Upload a zip created by the trace tool -g
                <Card className='w-full'> ./build/bin/upload path/to/trace.zip</Card>
                Or upload a JSON file directly
                <Card className='w-full'>./build/bin/upload path/to/prov_upload_input.json </Card>
            </section>
            <h2>
                <strong>Personal Access Tokens (PATs)</strong>
            </h2>

            <p>
                Personal Access Tokens, or <strong>PATs</strong>, serve as secure, program-specific alternatives to your
                standard login password. While you use a password to access a user interface, a PAT acts as a unique
                credential that allows external applications or scripts to communicate with your account securely.
            </p>

            <p>
                The primary advantage of using a token over your main password is <strong>isolation</strong>; you can
                generate multiple tokens for different tasks, allowing you to track activity and maintain security
                without ever exposing your primary account credentials to third-party tools.
            </p>

            <h3>Security and Storage</h3>
            <p>
                The security of this system relies on a <strong> view-once philosophy</strong>. When a token is
                generated, the raw character string is displayed to you exactly once. Because we prioritize your
                security, we do not store this plain-text token in our database; instead, we store a cryptographic hash.
                This means that once you close the creation window, the token is technically unrecoverable by
                anyone—including us.
            </p>

            <p>
                To further harden this process, we utilize a server-side secret combined with a{' '}
                <strong>Hash-based Message Authentication Code (HMAC)</strong>. This ensures that even in the unlikely
                event of a data breach, your tokens remain shielded against brute-force attacks because the underlying
                key to the hash remains hidden on our private servers.
            </p>

            <h3>Lifecycle Management</h3>
            <p>
                Managing these tokens is designed to be as granular as your security needs. You have the choice between{' '}
                <strong>revoking</strong> a token or <strong>deleting</strong> it entirely:
            </p>
            <ul>
                <li>
                    <strong>Revoke:</strong> Transitions the token to an Invalid state, effectively killing its access
                    while maintaining a historical record for auditing purposes.
                </li>
                <li>
                    <strong>Delete:</strong> Wipes the record from your dashboard completely.
                </li>
            </ul>

            <div>
                <strong>Important Security Note: </strong>
                Because a PAT carries the same weight as a password, it should always be treated as sensitive data. If a
                token is ever accidentally shared or exposed, revoking it immediately ensures that your account remains
                protected without requiring you to change your master password.
            </div>
        </Page>
    );
}
