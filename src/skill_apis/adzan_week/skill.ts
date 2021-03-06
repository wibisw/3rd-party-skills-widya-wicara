import { Request, Response } from 'express-serve-static-core';
import rp from 'request-promise';
import * as dotenv from 'dotenv';
import moment from 'moment';
import adzanWeekResource from './resource';
import redis from 'redis';
dotenv.config();

class AdzanWeekSkill {
  public setTodayToApps = async (req: Request, res: Response) => {
    const addZero = async(int:number) => { return int>9?`${int}`:`0${int}`}
    
    const uuid = req.query.uuid;
    const year = req.query.year;
    const month = await addZero(req.query.month);
    const day = await addZero(req.query.day);
    const offset = isNaN(+req.query.offset)?7:+req.query.offset;
    const specific = req.query.specific; // bool

    if(specific=="true") {
      const salat = req.query.salat; // str
      const jam = req.query.jam; // HH:mm

      let formatter = `${year}-${month}-${day}`+'T'+jam+`:00+0${offset}00`;
      let dataPlatform = moment(formatter).utc().format("x");
      // let dataPlatform = moment(formatter).utc().format("YYYY-MM-DDTHH:mm:00+0000");
      let dataApps = `${year}-${month}-${day}`+' '+jam;
      this.asyncPostToApps(dataApps,dataPlatform,salat,uuid);
      // adzanWeekResource.createOrUpdateUuid(uuid,salat, 1);
    }

    else {
      const subuh = req.query.subuh; // HH:mm
      const dzuhur = req.query.dzuhur; // HH:mm
      const ashar = req.query.ashar; // HH:mm
      const maghrib = req.query.maghrib; // HH:mm
      const isya = req.query.isya; // HH:mm
      const array = [subuh,dzuhur,ashar,maghrib,isya];
      const arrayStr = ["subuh","dzuhur","ashar","maghrib","isya"];

      /** method with delay */
      array.forEach((item:any,i:number) => {
        setTimeout(
          () => {
            let formatter = `${year}-${month}-${day}`+'T'+item+`:00+0${offset}00`;
            let dataPlatform = moment(formatter).utc().format("x");
            // let dataPlatform = moment(formatter).utc().format("YYYY-MM-DDTHH:mm:00+0000");
            let dataApps = `${year}-${month}-${day}`+' '+item;
            this.asyncPostToApps(dataApps,dataPlatform,arrayStr[i],uuid);
            // adzanWeekResource.createOrUpdateUuid(uuid,arrayStr[i], 1);
          },
          100*i
        );
      })

      /** default */
      // for(let i=0;i<array.length;i++){
      //   let formatter = `${year}-${month}-${day}`+'T'+array[i]+`:00+0${offset}00`;
      //   let dataPlatform = moment(formatter).utc().format("YYYY-MM-DDTHH:mm:00+0000");
      //   let dataApps = `${year}-${month}-${day}`+' '+array[i];
      //   this.asyncPostToApps(dataApps,dataPlatform,arrayStr[i],uuid);
      //   adzanWeekResource.createOrUpdateUuid(uuid,arrayStr[i], 1);
      // }
    }

    // const subuhFormatter = `${year}-${month}-${day}`+'T'+subuh+`:00+0${offset}00`;
    // const dzuhurFormatter = `${year}-${month}-${day}`+'T'+dzuhur+`:00+0${offset}00`;
    // const asharFormatter = `${year}-${month}-${day}`+'T'+ashar+`:00+0${offset}00`;
    // const maghribFormatter = `${year}-${month}-${day}`+'T'+maghrib+`:00+0${offset}00`;
    // const isyaFormatter = `${year}-${month}-${day}`+'T'+isya+`:00+0${offset}00`;

    // const subuhPlatform = moment(subuhFormatter).utc().format("YYYY-MM-DDTHH:mm:00+0000");
    // const dzuhurPlatform = moment(dzuhurFormatter).utc().format("YYYY-MM-DDTHH:mm:00+0000");
    // const asharPlatform = moment(asharFormatter).utc().format("YYYY-MM-DDTHH:mm:00+0000");
    // const maghribPlatform = moment(maghribFormatter).utc().format("YYYY-MM-DDTHH:mm:00+0000");
    // const isyaPlatform = moment(isyaFormatter).utc().format("YYYY-MM-DDTHH:mm:00+0000");

    // const subuhApps = `${year}-${month}-${day}`+' '+subuh+':00';
    // const dzuhurApps = `${year}-${month}-${day}`+' '+dzuhur+':00';
    // const asharApps = `${year}-${month}-${day}`+' '+ashar+':00';
    // const maghribApps = `${year}-${month}-${day}`+' '+maghrib+':00';
    // const isyaApps = `${year}-${month}-${day}`+' '+isya+':00';

    // this.asyncPostToApps(subuhApps,subuhPlatform,'subuh',uuid);
    // this.asyncPostToApps(dzuhurApps,dzuhurPlatform,'dzuhur',uuid);
    // this.asyncPostToApps(asharApps,asharPlatform,'ashar',uuid);
    // this.asyncPostToApps(maghribApps,maghribPlatform,'maghrib',uuid);
    // this.asyncPostToApps(isyaApps,isyaPlatform,'isya',uuid);

    res.send(JSON.parse(`{"status":"success", "action":"set-jadwal-salat-today-to-apps"}`));
  }

  public index = async (req: Request, res: Response) => {
    const addZero = async(int:number) => { return int>9?`${int}`:`0${int}`}

    const kota = req.query.kota;
    const offset = isNaN(+req.query.offset)?7:+req.query.offset;
    const year = req.query.year;
    const month = await addZero(req.query.month);
    const day = await addZero(req.query.day);
    const uuid = req.query.uuid;
    const setDay = req.query.setday?req.query.setday:7;
    const salat = req.query.salat;

    const tanggal = `${year}-${month}-${day}`;

    const tmp: any = await this.getFromApiBanghasan(kota,offset,tanggal,uuid,setDay,salat);

    const flatten = tmp.flat(1);

    const sorter = flatten.sort((a: any,b: any)=>{
      return (moment(a).unix()) - (moment(b).unix());
    })

    res.send(sorter);
  }

  private getFromApiBanghasan = async(kota: number, offset: number, tanggal: string, uuid: string, setDay:number, salat: string) => {
    return new Promise( async (resolve, reject) => {
      let tanggalNextSix: any[] = [];
        // moment(tanggal,"YYYY-MM-DD").add(1,'days').format('YYYY-MM-DD'),
        // moment(tanggal,"YYYY-MM-DD").add(2,'days').format('YYYY-MM-DD'),
        // moment(tanggal,"YYYY-MM-DD").add(3,'days').format('YYYY-MM-DD'),
        // moment(tanggal,"YYYY-MM-DD").add(4,'days').format('YYYY-MM-DD'),
        // moment(tanggal,"YYYY-MM-DD").add(5,'days').format('YYYY-MM-DD'),
        // moment(tanggal,"YYYY-MM-DD").add(6,'days').format('YYYY-MM-DD'),
      // ]

      for(let i=0;i<(setDay-1);i++){
        tanggalNextSix.push(moment(tanggal,"YYYY-MM-DD").add((i+1),'days').format('YYYY-MM-DD'));
      }

      const dataToReturn = await this.asyncGet(tanggalNextSix,kota,offset,uuid,salat);

      resolve(dataToReturn);
    })
  }

  private asyncGet = async(array: any, kota:number, offset:number, uuid:string, salat:string) => {
    return new Promise( async (resolve,reject) => {
      /** method with delay to resolve similarity between alert token */
      let requests = await array.forEach((item:any,index:number) => {
        setTimeout(
          () => {
            this.asyncGet2Step(kota,offset,item,uuid,salat,resolve)
          },
          1000*index
        );
      })

      resolve(['success']);

      /** default */
      // let dataToReturn: any[] = [];

      // let requests = await array.map((item: any) => {
      //   return new Promise( async(resolve,reject) => {
      //     try {dataToReturn.push(await this.asyncGet2Step(kota,offset,item,uuid,salat,resolve));}
      //     catch (error) {console.log(error);}
      //   });
      // })
    
      // Promise.all(requests).then(() => resolve(dataToReturn!));
    })
  }

  private asyncGet2Step = async(kota:number,offset:number,item:string,uuid:string,salat:string,cb:any) => {
    let dataToReturn: string[] = [];
    let zeroOffset = ((Math.abs(offset)+'').length>1)?Math.abs(offset):`0${Math.abs(offset)}`;
    let isoOffset = (offset<0)?`:00-${zeroOffset}00`:`:00+${zeroOffset}00`;

    await rp({uri:`http://api.banghasan.com/sholat/format/json/jadwal/kota/${kota}/tanggal/${item}`,json:true})
      .then((body) => {
        const subuhFormatter = item+'T'+body.jadwal.data.subuh+isoOffset;
        const dzuhurFormatter = item+'T'+body.jadwal.data.dzuhur+isoOffset;
        const asharFormatter = item+'T'+body.jadwal.data.ashar+isoOffset;
        const maghribFormatter = item+'T'+body.jadwal.data.maghrib+isoOffset;
        const isyaFormatter = item+'T'+body.jadwal.data.isya+isoOffset;

        /** it was like this YYYY-MM-DDTHH:mm:00+0000 */
        const subuhPlatform = moment(subuhFormatter).utc().format("x");
        const dzuhurPlatform = moment(dzuhurFormatter).utc().format("x");
        const asharPlatform = moment(asharFormatter).utc().format("x");
        const maghribPlatform = moment(maghribFormatter).utc().format("x");
        const isyaPlatform = moment(isyaFormatter).utc().format("x");

        const subuhApps = item+' '+body.jadwal.data.subuh;
        const dzuhurApps = item+' '+body.jadwal.data.dzuhur;
        const asharApps = item+' '+body.jadwal.data.ashar;
        const maghribApps = item+' '+body.jadwal.data.maghrib;
        const isyaApps = item+' '+body.jadwal.data.isya;
        
        dataToReturn.push(subuhPlatform);
        dataToReturn.push(dzuhurPlatform);
        dataToReturn.push(asharPlatform);
        dataToReturn.push(maghribPlatform);
        dataToReturn.push(isyaPlatform);

        if(salat=="all"){
          /** method with delay */
          setTimeout(() => this.asyncPostToApps(subuhApps,subuhPlatform,'subuh',uuid), 150);
          setTimeout(() => this.asyncPostToApps(dzuhurApps,dzuhurPlatform,'dzuhur',uuid), 300);
          setTimeout(() => this.asyncPostToApps(asharApps,asharPlatform,'ashar',uuid), 450);
          setTimeout(() => this.asyncPostToApps(maghribApps,maghribPlatform,'maghrib',uuid), 600);
          setTimeout(() => this.asyncPostToApps(isyaApps,isyaPlatform,'isya',uuid), 750);

          /** default */
          // this.asyncPostToApps(subuhApps,subuhPlatform,'subuh',uuid)
          // this.asyncPostToApps(dzuhurApps,dzuhurPlatform,'dzuhur',uuid)
          // this.asyncPostToApps(asharApps,asharPlatform,'ashar',uuid)
          // this.asyncPostToApps(maghribApps,maghribPlatform,'maghrib',uuid)
          // this.asyncPostToApps(isyaApps,isyaPlatform,'isya',uuid)
        } else {
          if(salat=="subuh") this.asyncPostToApps(subuhApps,subuhPlatform,'subuh',uuid);
          else if(salat=="dzuhur") this.asyncPostToApps(dzuhurApps,dzuhurPlatform,'dzuhur',uuid);
          else if(salat=="ashar") this.asyncPostToApps(asharApps,asharPlatform,'ashar',uuid);
          else if(salat=="maghrib") this.asyncPostToApps(maghribApps,maghribPlatform,'maghrib',uuid);
          else if(salat=="isya") this.asyncPostToApps(isyaApps,isyaPlatform,'isya',uuid);
        }

        /** uncomment this if default method */
        // cb(); 
      })
      .catch(err => {
        console.log("err");
      })

    return dataToReturn;
  }

  private asyncPostToApps = async(dateTimeApps: string, dateTimePlatform: string, namaSalat: string, uuid: string) => {
    const tmpToken = `reminder-${namaSalat}-${uuid}-${dateTimePlatform}`;
    const cekToken = await this.cekReminderTokenAvailability(tmpToken,uuid);
    console.log(`Cek Token, ${tmpToken}, with UUID, ${uuid} : ${cekToken}`);
    if(cekToken) return;
    
    var options = {
      method: 'GET',
      uri: `http://${process.env.BASE_BACKEND}/function/reminder`,
      form: {
        label:`waktu ${namaSalat} telah tiba`,
        ringtone:(namaSalat=='subuh')?'File://usr/misc/resources/alarm/WidyaWicaraAdzanSubuh.mp3':'File://usr/misc/resources/alarm/WidyaWicaraAdzanDhuhurAsharMaghribIsya.mp3',
        datetime:dateTimeApps,
        device_uuid:uuid,
        is_repeat: false,
        repeat_type: 'daily',
        repeat_count: -1,
        reminder_category: 'JADWAL_SHOLAT',
        alert_token: tmpToken
      }
    }

    await rp(options)
      .then(function (body) {
        // success
        console.log(`success send data to apps, ${namaSalat}, ${dateTimeApps}, ${uuid}`);
      })
      .catch(function (err) {
        console.log(err);
      });
    
    // console.log(`succesfully added 1 week of jadwal salat to Apps with id: ${uuid}`);
  }

  public debugAdzanWeek = async(req: Request, res: Response) => {
    const tmpToken = `reminder-isya-3366622638689267799-1601552700000`;
    const uuid = '3366622638689267799';
    const cekToken = await this.cekReminderTokenAvailability(tmpToken,uuid);
    console.log(`Cek Token, ${tmpToken}, with UUID, ${uuid} : ${cekToken}`);
    if(cekToken) return res.send();
    
    console.log("halo");
  }

  private cekReminderTokenAvailability = async(token:string, uuid:string) => {
    const data = await this.getFromRedis(uuid);

    if(data==null) return false;

    const searchToken = data.filter((obj:any) => obj.alert_token==token);

    if(searchToken.length==0) return false;
    else return true;
  }

  public getStatus = async(req: Request, res: Response) => {
    // const a = await adzanWeekResource.get(req.query.uuid);

    // if(a == null) var message = `not-found`;
    // else var message = `${a.week==true?"1 minggu":"1 hari"}`;
    const a = await this.getReminderByUuid(req.query.uuid);
    res.send(a);
  }


  public createOrUpdateUuid = async( req: Request, res: Response) => {
    adzanWeekResource.createOrUpdateUuid(req.query.uuid, req.query.salat, req.query.amount);
    res.send({});
  }

  public decrementer = async( req: Request, res: Response) => {
    adzanWeekResource.decrement();
    res.send({});
  }


  /** debug */
  private getReminderByUuid = async(uuid: string) => {
    var options = {
      method: 'GET',
      uri: `http://${process.env.BASE_BACKEND}/function/reminder/find`,
      form: {
        device_uuid:uuid
      }
    }
    // var options = 'http://localhost:3030/get-reminder';

    const data = await rp(options)
      .then(async(body) => {
        // success
        const parsed = JSON.parse(body);
        let result = '';

        if(parsed.status=="error"){
          result = `{ "uuid":"${uuid}", "allowed": "uuid-not-found"}`;
        } else {
          const tmp = await this.filterAndMap(parsed.message.data, uuid);
          result =  `{ "uuid":"${uuid}", "allowed": ${JSON.stringify(tmp)}}`;
        }

        return `{"status":"success","action":"get-status-set-adzan","data":${result}}`;
      })
      .catch(function (err) {
        console.log(err.message);
        return `{"status":"error","action":"get-status-set-adzan","message":"error at get reminder by uuid from backend apps","error":"cek log"}`;
      });
    
    return data;

    // const filtered = await this.filterAndMap(data)
    //   .then((body) => {
    //     return `{ "uuid":"${uuid}", "statusActive": ${JSON.stringify(body)}}`;
    //   })
    //   .catch((err) => {
    //     console.log(err.message);
    //     return `{ "status":"error", "message":"error at get reminder by uuid from backend apps", "error":"${err.message}"}`;
    //   }); 
    
  }

  private filterAndMap = async(data:any[], uuid:string) => {
    try {

      const deleteDuplicate = Array.from(new Set(data.map((a:any) => a.datetime)))
        .map(datetime => data.find((a:any) => a.datetime === datetime))
        .filter((obj: any) => obj.state.includes(`ONSCHEDULE`));
      
      this.setToRedis(JSON.stringify(deleteDuplicate),uuid);
      
      const salats = ["subuh","dzuhur","ashar","maghrib","isya"];

      const filterer = salats
        .map((salat:string) => {
          const tmp = deleteDuplicate
            .filter((obj: any) => obj.label.includes(`waktu ${salat} telah tiba`))
            .map((obj:any) => moment(obj.datetime, 'YYYY-MM-DD HH:mm:ss').diff(moment().format('YYYY-MM-DD'), 'days'));
          // console.log(tmp);
          let max = [Math.max(...tmp)][0];
          max = Math.abs(max)==Infinity?0:max;

          const today = (tmp.includes(0)) ? 'no' : 'yes';
          const week = (tmp.some(el => el > 0)) ? 'no' : 'yes';
          return { salat, today, week, max };
        });

      filterer.push({ 
        salat: 'all',
        today: filterer.some(val => val.today == 'no')?'no':'yes',
        week: filterer.some(val => val.week == 'no')?'no':'yes',
        max: Math.max(...(filterer.map(val => val.max)))
      });

      const reducer = filterer.reduce((map: any, obj: {salat: string; today: string; week: string; max: number;}) => (map[obj.salat] = { today: obj.today, week: obj.week, max: obj.max }, map), {});

      /**
       * reduce from [{salat: 'subuh', max: 2},{}....] to { subuh: 2, ....}
       */

      return reducer;
    } catch (error) {
      return error.message;
    }
  }

  private setToRedis = async(data:string, uuid:string) => {
    const client = redis.createClient(process.env.REDIS_URL!);

    client.set(`by-devwibi-reminder-${uuid}`, data);
    client.expire(`by-devwibi-reminder-${uuid}`, 60 * 30);
    
    client.quit();
  }

  private getFromRedis = async(uuid:string): Promise<any> => {
    return new Promise(resolve => {
      const client = redis.createClient(process.env.REDIS_URL!);
      client.get(`by-devwibi-reminder-${uuid}`, (err, reply) => {
        client.quit();
        if (err) resolve(null);
        resolve(JSON.parse(reply!));
      });
    });
  }

}

export const adzanWeekSkill = new AdzanWeekSkill();
