## gnuplot script to plot overhead vs duration per mode
set terminal pngcairo size 1200,800 enhanced font 'DejaVuSans,12'
set output 'overhead_vs_duration.png'
set title 'Wrapper overhead vs requested run duration'
set xlabel 'requested duration (s)'
set ylabel 'overhead (%)'
set grid
set logscale x 2
set key outside right vertical

# data file: report_duration_summary.csv
# columns: mode,duration_sec,native_mean,wrapped_mean,overhead_percent,n_native,n_wrapped

set datafile separator ','

set log xy

# explicit plot entries for each mode (some gnuplot versions don't support for[] in plot)
plot 1/x,\
    'report_duration_summary.csv' using (strcol(1) eq "cpu" ? $2 : 1/0):(strcol(1) eq "cpu" ? $5 : 1/0) with linespoints lw 2 pt 7 title 'cpu', \
    'report_duration_summary.csv' using (strcol(1) eq "frequent_io" ? $2 : 1/0):(strcol(1) eq "frequent_io" ? $5 : 1/0) with linespoints lw 2 pt 7 title 'frequent_io', \
    'report_duration_summary.csv' using (strcol(1) eq "large_io" ? $2 : 1/0):(strcol(1) eq "large_io" ? $5 : 1/0) with linespoints lw 2 pt 7 title 'large_io', \
    'report_duration_summary.csv' using (strcol(1) eq "occasional_io" ? $2 : 1/0):(strcol(1) eq "occasional_io" ? $5 : 1/0) with linespoints lw 2 pt 7 title 'occasional_io', \
    'report_duration_summary.csv' using (strcol(1) eq "open_close" ? $2 : 1/0):(strcol(1) eq "open_close" ? $5 : 1/0) with linespoints lw 2 pt 7 title 'open_close'
