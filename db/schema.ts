import { integer, real, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const clients = sqliteTable('clients', {
  id:text('id').primaryKey(), first:text('first').notNull(), last:text('last').notNull(), nin:text('nin').notNull(), phone:text('phone').notNull(), email:text('email').notNull(), address:text('address').notNull(), version:integer('version').notNull().default(1),
});
export const sales = sqliteTable('sales', {
  id:text('id').primaryKey(), clientId:text('client_id').notNull().references(()=>clients.id), sheet:text('sheet').notNull(), sourceRow:integer('source_row'), program:text('program').notNull(), zone:text('zone').notNull(), lot:text('lot').notNull(), position:text('position').notNull(), area:real('area'), priceM2:real('price_m2'), price:integer('price'), baseline:integer('baseline'), baselineFees:integer('baseline_fees'), sourceBalance:integer('source_balance'), date:text('date').notNull(), flags:text('flags').notNull(), raw:text('raw').notNull(), version:integer('version').notNull().default(1),
},t=>[index('idx_sales_client').on(t.clientId),uniqueIndex('idx_sales_program_lot').on(t.program,t.lot)]);
export const payments = sqliteTable('payments', {
  id:text('id').primaryKey(), saleId:text('sale_id').notNull().references(()=>sales.id), amount:integer('amount').notNull(), kind:text('kind').notNull(), date:text('date').notNull(), mode:text('mode').notNull(), reference:text('reference').notNull(), createdAt:text('created_at').notNull(), actor:text('actor').notNull(),
},t=>[index('idx_payments_sale').on(t.saleId)]);
export const notes = sqliteTable('notes', {id:text('id').primaryKey(),saleId:text('sale_id').notNull().references(()=>sales.id),content:text('content').notNull(),createdAt:text('created_at').notNull(),actor:text('actor').notNull()});
export const audit = sqliteTable('audit', {id:text('id').primaryKey(),saleId:text('sale_id'),action:text('action').notNull(),before:text('before'),after:text('after'),createdAt:text('created_at').notNull(),actor:text('actor').notNull()});
export const settings = sqliteTable('settings', {key:text('key').primaryKey(),value:text('value').notNull()});
export const collectionActions = sqliteTable('collection_actions', {
 id:text('id').primaryKey(),clientId:text('client_id').notNull().references(()=>clients.id),saleId:text('sale_id').references(()=>sales.id),title:text('title').notNull(),kind:text('kind').notNull(),dueDate:text('due_date').notNull(),priority:text('priority').notNull(),responsible:text('responsible').notNull(),status:text('status').notNull(),comment:text('comment').notNull(),result:text('result').notNull(),completedAt:text('completed_at'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),actor:text('actor').notNull(),version:integer('version').notNull().default(1),
},t=>[index('idx_collection_actions_client').on(t.clientId),index('idx_collection_actions_status_due').on(t.status,t.dueDate)]);
export const promises = sqliteTable('promises', {
 id:text('id').primaryKey(),clientId:text('client_id').notNull().references(()=>clients.id),saleId:text('sale_id').notNull().references(()=>sales.id),amount:integer('amount').notNull(),dueDate:text('due_date').notNull(),status:text('status').notNull(),comment:text('comment').notNull(),result:text('result').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),actor:text('actor').notNull(),version:integer('version').notNull().default(1),
},t=>[index('idx_promises_client').on(t.clientId),index('idx_promises_status_due').on(t.status,t.dueDate)]);
export const callLogs = sqliteTable('call_logs', {
 id:text('id').primaryKey(),clientId:text('client_id').notNull().references(()=>clients.id),saleId:text('sale_id').references(()=>sales.id),actionId:text('action_id').references(()=>collectionActions.id),channel:text('channel').notNull().default('Appel téléphonique'),nextTitle:text('next_title').notNull().default(''),nextResponsible:text('next_responsible').notNull().default(''),nextChannel:text('next_channel').notNull().default('Appel téléphonique'),clientResponse:text('client_response').notNull().default(''),promiseId:text('promise_id').references(()=>promises.id),callDate:text('call_date').notNull(),outcome:text('outcome').notNull(),summary:text('summary').notNull(),nextDate:text('next_date'),paymentDate:text('payment_date'),promisedAmount:integer('promised_amount'),agent:text('agent').notNull(),actor:text('actor').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('idx_call_logs_client_date').on(t.clientId,t.callDate),uniqueIndex('idx_call_logs_action').on(t.actionId)]);
export const appUsers=sqliteTable('app_users',{
 email:text('email').primaryKey(),name:text('name').notNull(),role:text('role').notNull(),active:integer('active').notNull().default(1),
 createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),passwordHash:text('password_hash'),passwordSetAt:text('password_set_at')
});
export const invitations=sqliteTable('invitations',{
 tokenHash:text('token_hash').primaryKey(),email:text('email').notNull().references(()=>appUsers.email),
 expiresAt:text('expires_at').notNull(),usedAt:text('used_at'),createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),sentAt:text('sent_at')
},t=>[index('invitations_email_idx').on(t.email)]);
export const sessions=sqliteTable('sessions',{
 tokenHash:text('token_hash').primaryKey(),email:text('email').notNull().references(()=>appUsers.email),
 expiresAt:text('expires_at').notNull(),createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[index('sessions_email_idx').on(t.email)]);
export const loginAttempts=sqliteTable('login_attempts',{
 email:text('email').primaryKey(),attempts:integer('attempts').notNull().default(0),
 windowStart:text('window_start').notNull(),blockedUntil:text('blocked_until')
});
export const userAudit=sqliteTable('user_audit',{
 id:text('id').primaryKey(),actor:text('actor').notNull(),targetEmail:text('target_email').notNull(),
 operation:text('operation').notNull(),createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});
