const express = require('express');
const db      = require('../config/database');
const router  = express.Router();

const requireAuth = (req, res, next) => {
    if (!req.session.clientEmail) return res.redirect('/auth/login');
    next();
};

// ── Page ─────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
    res.render('cameras', {
        clientName:  req.session.clientName  || 'User',
        clientEmail: req.session.clientEmail
    });
});

// ── Cameras list (grouped by location) ───────────────────────────────────────
router.get('/api/cameras', requireAuth, async (req, res) => {
    try {
        const email = req.session.clientEmail;

        const [locationRows] = await db.execute(
            'SELECT location_id, description FROM locations WHERE client_email = ?', [email]
        );
        if (locationRows.length === 0) return res.json([]);

        const locationIds = locationRows.map(r => r.location_id);
        const [cameraRows] = await db.execute(
            `SELECT camera_id, location_id FROM camera
             WHERE location_id IN (${locationIds.map(() => '?').join(',')})
             ORDER BY location_id, camera_id`,
            locationIds
        );

        const locMap = {};
        locationRows.forEach(l => {
            locMap[l.location_id] = { location_id: l.location_id, name: l.description, internal: [], external: [], _raw: [] };
        });

        cameraRows.forEach(c => {
            const loc = locMap[c.location_id];
            if (!loc) return;
            const id  = String(c.camera_id);
            const cam = { id: c.camera_id, name: id };
            if      (id.toUpperCase().startsWith('INT')) loc.internal.push(cam);
            else if (id.toUpperCase().startsWith('EXT')) loc.external.push(cam);
            else                                          loc._raw.push(cam);
        });

        Object.values(locMap).forEach(loc => {
            if (loc._raw.length) {
                const half = Math.ceil(loc._raw.length / 2);
                loc.internal.push(...loc._raw.slice(0, half));
                loc.external.push(...loc._raw.slice(half));
            }
            delete loc._raw;
        });

        res.json(Object.values(locMap));
    } catch (err) {
        console.error('Cameras API error:', err);
        res.json([]);
    }
});

// ── KVS HLS stream URL ────────────────────────────────────────────────────────
router.get('/api/stream/:streamName', requireAuth, async (req, res) => {
    const { streamName } = req.params;

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        return res.json({ down: true, reason: 'AWS credentials not configured' });
    }

    try {
        const { KinesisVideoClient, GetDataEndpointCommand }                           = require('@aws-sdk/client-kinesis-video');
        const { KinesisVideoArchivedMediaClient, GetHLSStreamingSessionURLCommand }    = require('@aws-sdk/client-kinesis-video-archived-media');

        const region      = process.env.AWS_REGION || 'us-east-2';
        const credentials = {
            accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {})
        };

        const kvsClient   = new KinesisVideoClient({ region, credentials });
        const endpointRes = await kvsClient.send(new GetDataEndpointCommand({
            StreamName: streamName,
            APIName: 'GET_HLS_STREAMING_SESSION_URL'
        }));

        const archivedClient = new KinesisVideoArchivedMediaClient({
            region, credentials, endpoint: endpointRes.DataEndpoint
        });

        const hlsRes = await archivedClient.send(new GetHLSStreamingSessionURLCommand({
            StreamName:               streamName,
            PlaybackMode:             'LIVE',
            HLSFragmentSelector:      { FragmentSelectorType: 'SERVER_TIMESTAMP' },
            ContainerFormat:          'FRAGMENTED_MP4',
            DiscontinuityMode:        'ALWAYS',
            DisplayFragmentTimestamp: 'ALWAYS',
            Expires:                  300
        }));

        res.json({ url: hlsRes.HLSStreamingSessionURL });
    } catch (err) {
        console.error('KVS stream error:', err.message);
        res.json({ down: true, reason: err.message });
    }
});

module.exports = router;
