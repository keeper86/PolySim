## plot_results.gnuplot
# Expects variables set via -e: INFILE (path to per-combo TSV), OUTFILE (path to PNG), TITLE (plot title)

set terminal pngcairo size 1200,600 enhanced font 'DejaVu Sans,10'
set output "test.png"
set datafile separator ","

set title "TITLE"
set key outside
set xlabel 'workers'
set ylabel 'per cent overhead (%)'
set grid
set style data linespoints
set format x '%g'
set xtics nomirror

INFILE = "./results.csv"

# Skip comment header lines starting with '#'
plot INFILE every ::1 using 0:($4/$2*100.) lt rgb '#1f77b4' lw 2 pt 7 title '% postproc', \
     INFILE every ::1 using 0:(100.*($3/$5 - 1)) lt rgb '#ff7f0e' lw 2 pt 5 title '% incr tracing'

set output
