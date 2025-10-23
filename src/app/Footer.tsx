import Image from 'next/image';

export default function Footer() {
    return (
        <footer className='w-full border-t border-base-300 bg-base-100 mt-12 p-4'>
            <div className='w-full flex flex-row items-center justify-between'>
                <div></div>
                <p className='text-xs text-center opacity-80 m-0 px-2'>
                    &copy; {new Date().getFullYear()} PolySim. All rights reserved.
                </p>
                <a
                    href='https://github.com/keeper86/PolySim'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-1 text-sm hover:underline px-2'
                >
                    <Image
                        src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
                        alt='GitHub'
                        width={24}
                        height={24}
                        className='inline-block align-middle'
                    />
                </a>
            </div>
        </footer>
    );
}
