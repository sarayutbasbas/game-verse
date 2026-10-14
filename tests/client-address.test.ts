import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clientAddress} from '../src/server/client-address.js';
test('only managed Vercel ingress enables forwarded IPs; malformed headers fall back',()=>{
  const old=process.env.VERCEL;
  const req:any={headers:{'x-forwarded-for':'203.0.113.7'},socket:{remoteAddress:'127.0.0.1'}};
  try{
    delete process.env.VERCEL;assert.equal(clientAddress(req),'127.0.0.1');
    process.env.VERCEL='1';assert.equal(clientAddress(req),'203.0.113.7');
    req.headers['x-forwarded-for']='invalid';assert.equal(clientAddress(req),'127.0.0.1');
  }finally{if(old===undefined)delete process.env.VERCEL;else process.env.VERCEL=old;}
});
