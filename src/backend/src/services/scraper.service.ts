import axios from 'axios';
import * as cheerio from 'cheerio';
// @ts-ignore
import translate from 'translate-google';
import { CloudinaryService } from './cloudinary.service';
import { logger } from '../utils/logger';
import { getTenantPrisma } from '../lib/prisma-tenant';

export class ScraperService {

    // State tracking
    private isScraping = false;
    private progress = {
        totalCategories: 0,
        currentCategory: '',
        processedCategories: 0,
        exercisesInCurrentCategory: 0,
        processedExercises: 0,
        lastError: '',
        logs: [] as string[]
    };

    /**
     * Helper: Fetch URL with retries
     */
    private async fetchWithRetry(url: string, retries = 3): Promise<any> {
        for (let i = 0; i < retries; i++) {
            try {
                // Randomize User-Agent to avoid simplistic bot detection
                const headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                };
                return await axios.get(url, { headers, timeout: 15000 });
            } catch (err: any) {
                const isLastAttempt = i === retries - 1;
                if (isLastAttempt) throw err;

                // Wait with exponential backoff
                const delay = 1000 * Math.pow(2, i);
                this.addLog(`Retry ${i + 1}/${retries} for ${url} after ${delay}ms`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    private addLog(msg: string) {
        const time = new Date().toLocaleTimeString();
        this.progress.logs.unshift(`[${time}] ${msg}`);
        if (this.progress.logs.length > 50) this.progress.logs.pop();
    }

    public getStatus() {
        return {
            isScraping: this.isScraping,
            progress: this.progress
        };
    }

    /**
     * Helper: Translate text
     */
    private async translateText(text: string): Promise<string> {
        if (!text || text.trim().length === 0) return '';

        // DICTIONARY OF FITNESS TERMINOLOGY
        // Ordered by Specificity: Phrases -> Compound Words -> Single Words
        const dictionary: Record<string, string> = {
            // Complex Exercise Names
            'Barbell Bench Press': 'Supino com Barra',
            'Dumbbell Bench Press': 'Supino com Halteres',
            'Incline Bench Press': 'Supino Inclinado',
            'Decline Bench Press': 'Supino Declinado',
            'Overhead Press': 'Desenvolvimento de Ombros',
            'Shoulder Press': 'Desenvolvimento',
            'Military Press': 'Desenvolvimento Militar',
            'Arnold Press': 'Desenvolvimento Arnold',
            'French Press': 'Tríceps Francês',
            'Leg Press': 'Leg Press',
            'Chest Press': 'Supino Máquina',

            'Lat Pulldown': 'Puxada Alta / Pulley Costas',
            'Seated Cable Row': 'Remada Sentada na Polia',
            'T-Bar Row': 'Remada Cavalinho',
            'Bent Over Row': 'Remada Curvada',
            'Upright Row': 'Remada Alta',
            'Face Pull': 'Face Pull (Puxada na Face)',

            'Deadlift': 'Levantamento Terra',
            'Stiff Leg Deadlift': 'Stiff',
            'Romanian Deadlift': 'RDL (Levantamento Terra Romeno)',
            'Sumo Deadlift': 'Levantamento Terra Sumô',

            'Squat': 'Agachamento',
            'Front Squat': 'Agachamento Frontal',
            'Goblet Squat': 'Agachamento Goblet',
            'Bulgarian Split Squat': 'Agachamento Búlgaro',
            'Hack Squat': 'Agachamento Hack',
            'Lunge': 'Afundo/Passada',

            'Leg Extension': 'Cadeira Extensora',
            'Leg Curl': 'Mesa Flexora',
            'Seated Leg Curl': 'Cadeira Flexora',
            'Calf Raise': 'Elevação de Panturrilha',

            'Biceps Curl': 'Rosca Direta',
            'Hammer Curl': 'Rosca Martelo',
            'Preacher Curl': 'Rosca Scott',
            'Concentration Curl': 'Rosca Concentrada',
            'Triceps Extension': 'Tríceps Testa',
            'Triceps Pushdown': 'Tríceps Pulley',
            'Dip': 'Mergulho / Paralelas',
            'Skull Crusher': 'Tríceps Testa',

            'Pull Up': 'Barra Fixa',
            'Chin Up': 'Barra Fixa (Supinada)',
            'Push Up': 'Flexão de Braço',
            'Sit Up': 'Abdominal',
            'Crunch': 'Abdominal',
            'Plank': 'Prancha ISométrica',
            'Jumping Jack': 'Polichinelo',
            'Burpee': 'Burpee',

            // Neck & Specific Movements (Requested by User)
            'Neck Extension': 'Extensão de Pescoço',
            'Neck Flexion': 'Flexão de Pescoço',
            'Lateral Neck Flexion': 'Flexão Lateral de Pescoço',
            'Neck Rotation': 'Rotação de Pescoço',
            'Neck Stretch': 'Alongamento de Pescoço',
            'Shrug': 'Encolhimento de Ombros',

            // Movement Descriptors
            'Extension': 'Extensão',
            'Flexion': 'Flexão',
            'Rotation': 'Rotação',
            'Elevation': 'Elevação',
            'Depression': 'Depressão',
            'Adduction': 'Adução',
            'Abduction': 'Abdução',
            'Prone': 'Pronado',
            'Supine': 'Supinado',
            'Lying': 'Deitado',
            'Seated': 'Sentado',
            'Standing': 'Em Pé',
            'Kneeling': 'Ajoelhado',

            // Equipment
            'Barbell': 'Barra',
            'Dumbbell': 'Halteres',
            'Kettlebell': 'Kettlebell',
            'Cable': 'Polia (Cabo)',
            'Machine': 'Máquina',
            'Smith Machine': 'Barra Guiada (Smith)',
            'Bodyweight': 'Peso Corporal',
            'Weighted': 'com Carga', // or "Ponderado"

            // Anatomy - Technical Terms
            'Latissimus Dorsi': 'Grande Dorsal',
            'Lats': 'Dorsais',
            'Trapezius': 'Trapézio',
            'Traps': 'Trapézio',
            'Rhomboids': 'Rombóides',
            'Pectoralis Major': 'Peitoral Maior',
            'Pectoralis Minor': 'Peitoral Menor',
            'Pecs': 'Peitoral',
            'Deltoids': 'Deltóides',
            'Delts': 'Deltóides',
            'Biceps Brachii': 'Bíceps',
            'Triceps Brachii': 'Tríceps',
            'Brachialis': 'Braquial',
            'Forearms': 'Antebraços',
            'Rectus Abdominis': 'Reto Abdominal',
            'Obliques': 'Oblíquos',
            'Erector Spinae': 'Eretores da Espinha',
            'Gluteus Maximus': 'Glúteo Máximo',
            'Glutes': 'Glúteos',
            'Quadriceps': 'Quadríceps',
            'Quads': 'Quadríceps',
            'Hamstrings': 'Isquiotibiais',
            'Hams': 'Posterior de Coxa',
            'Adductors': 'Adutores',
            'Abductors': 'Abdutores',
            'Gastrocnemius': 'Gastrocnêmio',
            'Soleus': 'Sóleo',
            'Calves': 'Panturrilhas',
            'Sternocleidomastoid': 'Esternocleidomastoideo',
            'Splenius': 'Esplênio',
            'Levator Scapulae': 'Levantador da Escápula',
            'Scalenes': 'Escalenos',

            // Common Translation Failures
            'Wide Grip': 'Pegada Aberta',
            'Close Grip': 'Pegada Fechada',
            'Neutral Grip': 'Pegada Neutra',
            'Reverse Grip': 'Pegada Inversa',
            'Single Arm': 'Unilateral',
            'One Arm': 'Unilateral',
            'High Pulley': 'Polia Alta',
            'Low Pulley': 'Polia Baixa',

            // SPECIFIC NECK EXERCISES (Fixed Names)
            'Weighted Lying Neck Extension': 'Extensão de Pescoço Deitado com Carga',
            'Weighted Lying Neck Flexion': 'Flexão de Pescoço Deitado com Carga',
            'Lying Weighted Lateral Neck Flexion': 'Flexão Lateral de Pescoço Deitado',
            'Lying Face Down Plate Neck Resistance': 'Extensão de Pescoço Deitado com Anilha',
            'Gittleson Shrug': 'Encolhimento Gittleson',
            'Neck Flexion Stretch': 'Alongamento de Flexão de Pescoço',
            'Neck Extension Stretch': 'Alongamento de Extensão de Pescoço',
            'Diagonal Neck Stretch': 'Alongamento Diagonal de Pescoço',
            'Side Push Neck Stretch': 'Alongamento Lateral de Pescoço',
            'Neck Rotation Stretch': 'Alongamento de Rotação de Pescoço',
            'Side Neck Stretch': 'Alongamento Lateral de Pescoço',

            // Common Headers & Instructions phrases
            'Overview': 'Visão Geral',
            'Common Mistakes': 'Erros Comuns',
            'Tips for Proper Form': 'Dicas de Execução',
            'Benefits': 'Benefícios',
            'How to Perform': 'Como Fazer',
            'Execution': 'Execução',
            'Start Position': 'Posição Inicial',
            'Preparation': 'Preparação',
            'Instructions': 'Instruções',
            'Keep your back straight': 'Mantenha as costas retas',
            'Engage your core': 'Contraia o abdômen',
            'Return to starting position': 'Retorne à posição inicial',
            'Repeat for the desired number of repetitions': 'Repita pelo número desejado de repetições',
        };

        // PRE-TRANSLATION: Apply dictionary replacements
        let inputText = text;
        const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length); // Match longest phrases first

        for (const key of sortedKeys) {
            const regex = new RegExp(key, 'gi');
            inputText = inputText.replace(regex, dictionary[key]);
        }

        // Translate the refined text logic
        // If the text was heavily modified (e.g. fully replaced exercise name), we might not even need Google for that part
        // But for descriptions, we need Google.

        try {
            await new Promise(r => setTimeout(r, 500));
            let res = await translate(inputText, { to: 'pt' });

            // POST-TRANSLATION CLEANUP (Fix grammar artifacts if needed)
            if (res) {
                res = res.replace(/As costas mais largas/gi, 'Costas / Asa')
                    .replace(/Imprensa/gi, 'Supino') // "Press" -> "Imprensa" fix
                    .replace(/Enrolar/gi, 'Rosca')   // "Curl" -> "Enrolar" fix
                    .replace(/Linha/gi, 'Remada')    // "Row" -> "Linha" fix
                    .replace(/Ondulação/gi, 'Rosca'); // "Curl" -> "Ondulação" fix
            }

            return res;
        } catch (error) {
            logger.warn(`Translation failed for: ${text.substring(0, 20)}...`, error);
            try {
                await new Promise(r => setTimeout(r, 2000));
                return await translate(inputText, { to: 'pt' });
            } catch (e) {
                return inputText; // Return the refined input text if Google fails
            }
        }
    }

    private async translateArray(arr: string[]): Promise<string[]> {
        const res: string[] = [];
        for (const item of arr) {
            res.push(await this.translateText(item));
        }
        return res;
    }

    /**
     * Main Entry: Scrape a Single Exercise
     */
    async scrapeExercise(url: string, tenantId: string, userId: string): Promise<any> {
        const prisma = getTenantPrisma(tenantId);

        try {
            // Check duplicates first
            const existingByUrl = await prisma.exercise.findFirst({
                where: { sourceUrl: url }
            });
            if (existingByUrl) return existingByUrl;

            // Fetch Data
            const { data } = await this.fetchWithRetry(url);
            const $ = cheerio.load(data);

            // 1. Scrape Basic Info
            let nameEn = $('.page_title').first().text().trim() || $('h1').first().text().trim();
            if (!nameEn) throw new Error(`Could not find title for ${url}`);

            // 2. Scrape Instructions (Preserving Structure)
            const instructionsEn: string[] = [];

            // Look for "How to Perform" or similar headers
            const possibleHeaders = ['How to Perform', 'Execution', 'Instructions', 'Steps'];
            let instructionsContainer: cheerio.Cheerio<any> | null = null;

            $('h2, h3').each((i, el) => {
                const text = $(el).text();
                if (possibleHeaders.some(h => text.includes(h))) {
                    instructionsContainer = $(el).nextAll('ol').first();
                    return false; // break
                }
            });

            if (instructionsContainer && instructionsContainer.length) {
                instructionsContainer.children('li').each((i, li) => {
                    const $li = $(li);
                    const phaseTitle = $li.find('strong').first().text().trim(); // e.g., "Setup"

                    // Check for sub-list
                    const subList = $li.find('ul li');
                    if (subList.length > 0) {
                        const subSteps: string[] = [];
                        subList.each((j, subEl) => {
                            subSteps.push($(subEl).text().trim());
                        });
                        if (phaseTitle) {
                            instructionsEn.push(`**${phaseTitle}**: ${subSteps.join(' ')}`);
                        } else {
                            instructionsEn.push(subSteps.join(' '));
                        }
                    } else {
                        // Plain list item
                        let text = $li.text().trim();
                        // Remove title from text if duplicated
                        if (phaseTitle && text.startsWith(phaseTitle)) {
                            text = text.replace(phaseTitle, '').trim();
                        }
                        if (phaseTitle) {
                            instructionsEn.push(`**${phaseTitle}**: ${text}`);
                        } else {
                            instructionsEn.push(text);
                        }
                    }
                });
            } else {
                // Fallback: Parse paragraphs
                $('.exercise_content p').each((i, el) => {
                    const t = $(el).text().trim();
                    if (t.length > 50 && !t.includes('Overview') && !t.includes('Benefit')) {
                        instructionsEn.push(t);
                    }
                });
            }

            // 3. Scrape Detailed Muscles (Target, Synergists)
            const muscleGroups: string[] = [];
            const secondaryMuscles: string[] = [];

            // Progress Bars Strategy (High Precision)
            $('.vc_progress_bar .vc_single_bar').each((i, el) => {
                const label = $(el).find('.vc_label').text().trim();
                // "Target - Pectoralis Major"
                if (label.toLowerCase().includes('target')) {
                    const muscle = label.split('-')[1]?.trim() || label;
                    if (muscle) muscleGroups.push(muscle);
                }
                // "Synergists - Triceps"
                else if (label.toLowerCase().includes('synergist') || label.toLowerCase().includes('stabilizer')) {
                    const muscle = label.split('-')[1]?.trim() || label;
                    if (muscle) secondaryMuscles.push(muscle);
                }
            });

            // Sidebar Strategy (Fallback)
            if (muscleGroups.length === 0) {
                $('.spec_group.muscle_groups li span').each((i, el) => {
                    muscleGroups.push($(el).text().trim());
                });
            }

            // 4. Scrape Equipment
            const equipmentList: string[] = [];
            $('.spec_group.equipments li span').each((i, el) => {
                equipmentList.push($(el).text().trim());
            });
            const equipmentEn = equipmentList.join(', ');

            // 5. Description & Extra Content (Tips, Mistakes, Benefits)
            let descriptionEn = '';

            // Overview logic
            const overviewHeader = $('h2:contains("Overview")');
            if (overviewHeader.length) {
                // Gather paragraphs until next H2 or separator
                let next = overviewHeader.next();
                while (next.length && !next.is('h2') && !next.is('.vc_separator')) {
                    if (next.is('p')) descriptionEn += next.text().trim() + '\n\n';
                    next = next.next();
                }
            } else {
                descriptionEn = $('.exercise_content p').first().text().trim();
            }

            // Append "Tips", "Mistakes", "Benefits"
            const extras: string[] = [];

            const extractSection = (keyword: string, titlePrefix: string) => {
                $('h2, h3').each((i, el) => {
                    if ($(el).text().includes(keyword)) {
                        const list = $(el).nextAll('ul, ol').first();
                        if (list.length) {
                            const items: string[] = [];
                            list.find('li').each((j, li) => {
                                // Only get direct text to avoid mess
                                items.push('- ' + $(li).text().trim());
                            });
                            if (items.length) {
                                extras.push(`### ${titlePrefix}\n${items.join('\n')}`);
                            }
                        }
                    }
                });
            };

            extractSection('Tips', 'Tips for Proper Form');
            extractSection('Mistakes', 'Common Mistakes');
            extractSection('Benefits', 'Benefits');

            if (extras.length) {
                descriptionEn += '\n\n' + extras.join('\n\n');
            }

            // 6. Image / GIF
            let gifUrl = $('img[src*=".gif"]').first().attr('src') || '';
            if (!gifUrl) {
                // Try finding any content image
                gifUrl = $('.exercise_content img').first().attr('src') || '';
            }

            // 7. Translate Everything
            const [
                namePt,
                descriptionPt,
                equipmentPt,
                musclesPt,
                secondaryMusclesPt,
                instructionsPt
            ] = await Promise.all([
                this.translateText(nameEn),
                this.translateText(descriptionEn),
                this.translateText(equipmentEn),
                this.translateArray(muscleGroups),
                this.translateArray(secondaryMuscles),
                this.translateArray(instructionsEn)
            ]);

            // 8. Upload Image to Cloudinary (Optimize storage)
            let finalImageUrl = gifUrl;
            if (gifUrl && !gifUrl.includes('data:image')) {
                try {
                    const imgResp = await axios.get(gifUrl, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(imgResp.data, 'binary');
                    const sanitizedName = namePt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "_");
                    const publicId = `${sanitizedName}_${Date.now()}`;

                    // Upload to 'gifs-exercicios' folder
                    const upload = await CloudinaryService.uploadExerciseImage(
                        buffer,
                        'temp_id', // Not using file object, so dummy ID
                        publicId,
                        'gifs-exercicios'
                    );

                    if (upload && upload.url) {
                        finalImageUrl = upload.url;
                    }
                } catch (e) {
                    logger.warn(`Cloudinary upload failed for ${gifUrl}, using original URL.`, e);
                }
            }

            // 9. Create Database Record
            // Wrap in simple retry for P1017 (Server has closed connection)
            let exercise;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    exercise = await prisma.exercise.create({
                        data: {
                            tenantId,
                            name: namePt,
                            description: descriptionPt,
                            category: 'Strength', // Can be refined
                            muscleGroups: musclesPt,
                            secondaryMuscles: secondaryMusclesPt,
                            equipment: equipmentPt,
                            instructions: instructionsPt,
                            videoUrl: finalImageUrl,
                            thumbnailUrl: finalImageUrl,
                            sourceUrl: url,
                            isPublic: true,
                            createdBy: userId
                        }
                    });
                    break;
                } catch (dbErr: any) {
                    if (dbErr.code === 'P1017' && attempt < 2) {
                        this.addLog(`DB Connection Closed, Retrying save (${attempt + 1})...`);
                        await new Promise(r => setTimeout(r, 1500));
                        continue;
                    }
                    throw dbErr;
                }
            }

            this.addLog(`Success: ${namePt}`);
            return exercise;

        } catch (e: any) {
            this.addLog(`Error scraping ${url}: ${e.message}`);
            logger.error(`Scrape Exercise Error [${url}]`, e);
            throw e;
        }
    }

    /**
     * Main Entry: Scrape Catalog
     */
    async scrapeCatalog(tenantId: string, userId: string) {
        if (this.isScraping) return { message: 'Scraping is already in progress.' };

        this.isScraping = true;
        this.progress = {
            totalCategories: 0,
            currentCategory: 'Initializing...',
            processedCategories: 0,
            exercisesInCurrentCategory: 0,
            processedExercises: 0,
            lastError: '',
            logs: []
        };
        this.addLog('Starting Catalog Scratch...');

        const rootUrl = 'https://fitnessprogramer.com/exercise-primary-muscle/';
        // Default categories if discovery fails
        let categories = [
            'chest', 'shoulders', 'biceps', 'triceps', 'back', 'leg', 'abs', 'cardio'
        ];

        // 1. Discover Categories
        try {
            const { data } = await this.fetchWithRetry(rootUrl);
            const $ = cheerio.load(data);
            const foundCats: string[] = [];
            $('a[href*="/exercise-primary-muscle/"]').each((i, el) => {
                const href = $(el).attr('href');
                if (href) {
                    const parts = href.split('/').filter(p => p);
                    const slug = parts[parts.length - 1];
                    if (slug && !foundCats.includes(slug) && slug !== 'exercise-primary-muscle') {
                        foundCats.push(slug);
                    }
                }
            });
            if (foundCats.length > 5) categories = foundCats;
            this.addLog(`Discovered ${categories.length} categories.`);
        } catch (e) {
            logger.warn('Category discovery failed, using defaults.', e);
        }

        this.progress.totalCategories = categories.length;

        // 2. Process Background
        this.processCategories(categories, tenantId, userId).then(() => {
            this.addLog('Catalog Scraping Completed Successfully.');
        }).catch(err => {
            this.addLog(`Catalog Scraping Failed: ${err.message}`);
        }).finally(() => {
            this.isScraping = false;
        });

        // Fix: Return categoriesFound with count and array
        return {
            success: true,
            message: 'Scraping started in background',
            categories,
            categoriesFound: categories.length
        };
    }

    private async processCategories(categories: string[], tenantId: string, userId: string) {
        for (const cat of categories) {
            this.progress.currentCategory = cat;
            this.progress.exercisesInCurrentCategory = 0;
            this.progress.processedExercises = 0;

            const catUrl = `https://fitnessprogramer.com/exercise-primary-muscle/${cat}/`;
            this.addLog(`Fetching content for category: ${cat}`);

            try {
                const { data } = await this.fetchWithRetry(catUrl);
                const $ = cheerio.load(data);

                // Find all exercise links
                const links: string[] = [];
                // Strict selector first
                $('article .entry-title a').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href) links.push(href);
                });
                // Loose selector backup
                if (links.length === 0) {
                    $('a[href*="/exercise/"]').each((i, el) => {
                        const href = $(el).attr('href');
                        if (href && !links.includes(href)) links.push(href);
                    });
                }

                this.progress.exercisesInCurrentCategory = links.length;
                this.addLog(`Found ${links.length} exercises in ${cat}`);

                // Process Exercises
                for (const link of links) {
                    try {
                        await this.scrapeExercise(link, tenantId, userId);
                        this.progress.processedExercises++;
                        // Rate limit to be nice
                        await new Promise(r => setTimeout(r, 2000));
                    } catch (e: any) {
                        // Continue to next exercise even if one fails
                        // Log is handled in scrapeExercise
                    }
                }

                this.progress.processedCategories++;

            } catch (e: any) {
                this.addLog(`Failed to process category ${cat}: ${e.message}`);
            }
        }
    }
}

export const scraperService = new ScraperService();
