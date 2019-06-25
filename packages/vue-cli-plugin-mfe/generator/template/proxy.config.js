module.exports = {
  '/api/progress/*': {
    target: 'http://172.16.0.131:3701', // target host
    // target: 'http://localhost:3701', // target host
    changeOrigin: true, // needed for virtual hosted sites
    ws: true,
  },
  '/api/auth/*': {
    target: 'http://192.168.1.2:3901',
    changeOrigin: true, // needed for virtual hosted sites
    ws: true,
  },
  '/api/mfe/*': {
    // target: 'http://172.16.30.206:3010',
    target: 'http://192.168.1.2:3010',
    changeOrigin: true, // needed for virtual hosted sites
  },
  '/ibuildEndpoint': {
    // target: 'http://172.16.30.206:3010',
    target: 'http://192.168.1.2:3010',
    // target: 'http://172.16.0.132',
    changeOrigin: true, // needed for virtual hosted sites
    ws: true,
  },
  '/api/*': {
    target: 'http://172.16.0.131:3001', // target host http://localhost:3001, http://172.16.0.131:3001
    // target: 'http://localhost:1889',
    changeOrigin: true, // needed for virtual hosted sites
    ws: true, // proxy websockets
  },
}
