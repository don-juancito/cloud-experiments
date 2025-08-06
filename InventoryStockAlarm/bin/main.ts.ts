#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InventoryStockAlarmStack } from '../lib/inventory_stock_alarm-stack';

const app = new cdk.App();
new InventoryStockAlarmStack(app, 'InventoryStockAlarmStack', {
  targetEmail: 'jl.orozco.villa@gmail.com',
  productUrl: 'https://www.mediamarkt.hu/hu/product/_nintendo-switch-2-mario-kart-world-1482762.html',
  availabilityString: 'Online elérhető',
});