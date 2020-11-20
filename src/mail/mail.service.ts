import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { EmailVar, MailModuleOptions } from './mail.interfaces';
import { CONFIG_OPTIONS } from '../common/common.constants';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {
    // this.sendEmail('testing', 'verify-email');
  }
  async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ): Promise<boolean> {
    // console.log(got);
    // console.log(FormData);
    const form = new FormData();
    form.append('from', `Azerc from cub-uber <mailgun@${this.options.domain}>`);
    form.append('to', `fingersoftgame@gmail.com`);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));
    // form.append('v:code', 'dr3023j');
    // form.append('v:username', 'azerc');
    try {
      await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      return true;
    } catch (e) {
      return false;
    }
  }
  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify your Email', `verify-email`, [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
