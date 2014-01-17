Structural Health Monitoring On The Go - SHMOTG

This project allows the user to zoom and scan through their SHM data using an interface like the one in this static demo: http://bl.ocks.org/MattWoelk/5196687

The thesis paper can be found at http://mattwoelk.ca/thesis/paper.pdf

## Server Maintenance

Run metascraper.js to bin data. Example for girder 6:

    cd Server
    node metascraper.js

If some higher levels are not binned, run metarebinner.js on level 16. Example for sensor 6:

    node Server/metarebinner.js 2011 01 2013 01 16 6

Then restart the server:

    <ctrl-c>
    forever Server/serv.js

Other binning scripts are found in the Server folder.
