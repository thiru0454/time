import { Subject, Faculty } from '@/integrations/supabase/types';
import { RoomAssignment, SchedulingConflict } from './advancedSchedulingEngine';

export interface OptimizationResult {
  timetable: any;
  score: number;
  conflicts: SchedulingConflict[];
  facultyWorkload: { [facultyId: string]: number };
  roomUtilization: { [roomId: string]: number };
  optimizationStats: {
    algorithm: string;
    iterations: number;
    improvements: number;
    executionTime: number;
    finalScore: number;
  };
}

export interface GeneticAlgorithmConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  elitismRate: number;
}

export interface SimulatedAnnealingConfig {
  initialTemperature: number;
  coolingRate: number;
  iterationsPerTemperature: number;
  minTemperature: number;
}

export interface GreedyConfig {
  maxIterations: number;
  improvementThreshold: number;
  localSearchDepth: number;
}

export class AIOptimizationEngine {
  private subjects: Subject[] = [];
  private faculty: Faculty[] = [];
  private rooms: RoomAssignment[] = [];
  private conflicts: SchedulingConflict[] = [];

  constructor() {}

  /**
   * Initialize the optimization engine with data
   */
  initialize(
    subjects: Subject[],
    faculty: Faculty[],
    rooms: RoomAssignment[],
    conflicts: SchedulingConflict[] = []
  ) {
    this.subjects = subjects;
    this.faculty = faculty;
    this.rooms = rooms;
    this.conflicts = conflicts;
  }

  /**
   * Run genetic algorithm optimization
   */
  runGeneticAlgorithm(config: GeneticAlgorithmConfig = {
    populationSize: 50,
    generations: 100,
    mutationRate: 0.1,
    crossoverRate: 0.8,
    elitismRate: 0.1
  }): OptimizationResult {
    console.log('🧬 Starting Genetic Algorithm optimization...');
    const startTime = Date.now();

    // Initialize population
    let population = this.initializePopulation(config.populationSize);
    let bestSolution = population[0];
    let bestScore = this.calculateFitness(bestSolution);

    for (let generation = 0; generation < config.generations; generation++) {
      // Evaluate fitness for all individuals
      const fitnessScores = population.map(individual => ({
        individual,
        fitness: this.calculateFitness(individual)
      }));

      // Sort by fitness (higher is better)
      fitnessScores.sort((a, b) => b.fitness - a.fitness);

      // Update best solution
      if (fitnessScores[0].fitness > bestScore) {
        bestSolution = JSON.parse(JSON.stringify(fitnessScores[0].individual));
        bestScore = fitnessScores[0].fitness;
      }

      // Create new population
      const newPopulation = [];

      // Elitism: Keep best individuals
      const eliteCount = Math.floor(config.populationSize * config.elitismRate);
      for (let i = 0; i < eliteCount; i++) {
        newPopulation.push(JSON.parse(JSON.stringify(fitnessScores[i].individual)));
      }

      // Generate rest of population through crossover and mutation
      while (newPopulation.length < config.populationSize) {
        const parent1 = this.selectParent(fitnessScores);
        const parent2 = this.selectParent(fitnessScores);

        let child = this.crossover(parent1, parent2, config.crossoverRate);
        child = this.mutate(child, config.mutationRate);
        newPopulation.push(child);
      }

      population = newPopulation;

      if (generation % 10 === 0) {
        console.log(`Generation ${generation}: Best Score = ${bestScore.toFixed(2)}`);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ Genetic Algorithm completed in ${executionTime}ms`);

    return {
      timetable: bestSolution,
      score: bestScore,
      conflicts: this.detectConflicts(bestSolution),
      facultyWorkload: this.calculateFacultyWorkload(bestSolution),
      roomUtilization: this.calculateRoomUtilization(bestSolution),
      optimizationStats: {
        algorithm: 'genetic',
        iterations: config.generations,
        improvements: 0, // Would need to track during execution
        executionTime,
        finalScore: bestScore
      }
    };
  }

  /**
   * Run simulated annealing optimization
   */
  runSimulatedAnnealing(config: SimulatedAnnealingConfig = {
    initialTemperature: 1000,
    coolingRate: 0.95,
    iterationsPerTemperature: 10,
    minTemperature: 1
  }): OptimizationResult {
    console.log('🔥 Starting Simulated Annealing optimization...');
    const startTime = Date.now();

    let currentSolution = this.generateRandomSolution();
    let currentScore = this.calculateFitness(currentSolution);
    let bestSolution = JSON.parse(JSON.stringify(currentSolution));
    let bestScore = currentScore;

    let temperature = config.initialTemperature;
    let iterations = 0;

    while (temperature > config.minTemperature) {
      for (let i = 0; i < config.iterationsPerTemperature; i++) {
        // Generate neighbor solution
        const neighborSolution = this.generateNeighbor(currentSolution);
        const neighborScore = this.calculateFitness(neighborSolution);

        // Calculate acceptance probability
        const deltaE = neighborScore - currentScore;
        const acceptanceProbability = Math.exp(deltaE / temperature);

        // Accept or reject the neighbor
        if (deltaE > 0 || Math.random() < acceptanceProbability) {
          currentSolution = neighborSolution;
          currentScore = neighborScore;

          // Update best solution
          if (currentScore > bestScore) {
            bestSolution = JSON.parse(JSON.stringify(currentSolution));
            bestScore = currentScore;
          }
        }

        iterations++;
      }

      // Cool down
      temperature *= config.coolingRate;

      if (iterations % 100 === 0) {
        console.log(`Temperature: ${temperature.toFixed(2)}, Best Score: ${bestScore.toFixed(2)}`);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ Simulated Annealing completed in ${executionTime}ms`);

    return {
      timetable: bestSolution,
      score: bestScore,
      conflicts: this.detectConflicts(bestSolution),
      facultyWorkload: this.calculateFacultyWorkload(bestSolution),
      roomUtilization: this.calculateRoomUtilization(bestSolution),
      optimizationStats: {
        algorithm: 'simulated_annealing',
        iterations,
        improvements: 0, // Would need to track during execution
        executionTime,
        finalScore: bestScore
      }
    };
  }

  /**
   * Run greedy algorithm optimization
   */
  runGreedyAlgorithm(config: GreedyConfig = {
    maxIterations: 1000,
    improvementThreshold: 0.01,
    localSearchDepth: 5
  }): OptimizationResult {
    console.log('🎯 Starting Greedy Algorithm optimization...');
    const startTime = Date.now();

    let currentSolution = this.generateInitialSolution();
    let currentScore = this.calculateFitness(currentSolution);
    let bestSolution = JSON.parse(JSON.stringify(currentSolution));
    let bestScore = currentScore;
    let improvements = 0;

    for (let iteration = 0; iteration < config.maxIterations; iteration++) {
      let improved = false;

      // Local search: try small changes
      for (let depth = 0; depth < config.localSearchDepth; depth++) {
        const neighborSolution = this.generateLocalNeighbor(currentSolution);
        const neighborScore = this.calculateFitness(neighborSolution);

        if (neighborScore > currentScore + config.improvementThreshold) {
          currentSolution = neighborSolution;
          currentScore = neighborScore;
          improved = true;
          improvements++;

          if (currentScore > bestScore) {
            bestSolution = JSON.parse(JSON.stringify(currentSolution));
            bestScore = currentScore;
          }
        }
      }

      // If no improvement found, try larger changes
      if (!improved) {
        const randomSolution = this.generateRandomSolution();
        const randomScore = this.calculateFitness(randomSolution);

        if (randomScore > currentScore) {
          currentSolution = randomSolution;
          currentScore = randomScore;
          improvements++;
        }
      }

      if (iteration % 100 === 0) {
        console.log(`Iteration ${iteration}: Best Score = ${bestScore.toFixed(2)}`);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ Greedy Algorithm completed in ${executionTime}ms`);

    return {
      timetable: bestSolution,
      score: bestScore,
      conflicts: this.detectConflicts(bestSolution),
      facultyWorkload: this.calculateFacultyWorkload(bestSolution),
      roomUtilization: this.calculateRoomUtilization(bestSolution),
      optimizationStats: {
        algorithm: 'greedy',
        iterations: config.maxIterations,
        improvements,
        executionTime,
        finalScore: bestScore
      }
    };
  }

  /**
   * Run hybrid optimization combining multiple algorithms
   */
  runHybridOptimization(): OptimizationResult {
    console.log('🚀 Starting Hybrid Optimization...');
    const startTime = Date.now();

    // Start with greedy for quick initial solution
    const greedyResult = this.runGreedyAlgorithm({
      maxIterations: 500,
      improvementThreshold: 0.01,
      localSearchDepth: 3
    });

    // Refine with genetic algorithm
    this.initialize(this.subjects, this.faculty, this.rooms, greedyResult.conflicts);
    const geneticResult = this.runGeneticAlgorithm({
      populationSize: 30,
      generations: 50,
      mutationRate: 0.15,
      crossoverRate: 0.8,
      elitismRate: 0.2
    });

    // Final polish with simulated annealing
    this.initialize(this.subjects, this.faculty, this.rooms, geneticResult.conflicts);
    const annealingResult = this.runSimulatedAnnealing({
      initialTemperature: 500,
      coolingRate: 0.98,
      iterationsPerTemperature: 5,
      minTemperature: 0.1
    });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Hybrid Optimization completed in ${executionTime}ms`);

    return {
      timetable: annealingResult.timetable,
      score: annealingResult.score,
      conflicts: annealingResult.conflicts,
      facultyWorkload: annealingResult.facultyWorkload,
      roomUtilization: annealingResult.roomUtilization,
      optimizationStats: {
        algorithm: 'hybrid',
        iterations: greedyResult.optimizationStats.iterations + 
                   geneticResult.optimizationStats.iterations + 
                   annealingResult.optimizationStats.iterations,
        improvements: greedyResult.optimizationStats.improvements + 
                     geneticResult.optimizationStats.improvements + 
                     annealingResult.optimizationStats.improvements,
        executionTime,
        finalScore: annealingResult.score
      }
    };
  }

  // Private helper methods

  private initializePopulation(size: number): any[] {
    const population = [];
    for (let i = 0; i < size; i++) {
      population.push(this.generateRandomSolution());
    }
    return population;
  }

  private generateRandomSolution(): any {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const timeSlots = [
      '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00', '12:00 to 12:55',
      '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
    ];

    const solution: any = {};
    days.forEach(day => {
      solution[day] = {};
      timeSlots.forEach(slot => {
        if (Math.random() < 0.3) { // 30% chance of assignment
          const randomSubject = this.subjects[Math.floor(Math.random() * this.subjects.length)];
          const randomFaculty = this.faculty[Math.floor(Math.random() * this.faculty.length)];
          solution[day][slot] = {
            subject: randomSubject.name,
            faculty: randomFaculty.name,
            type: randomSubject.subject_type
          };
        }
      });
    });

    return solution;
  }

  private generateInitialSolution(): any {
    // Generate a more structured initial solution
    const solution = this.generateRandomSolution();
    
    // Prioritize labs and practicals in morning slots
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const morningSlots = ['9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00'];
    
    days.forEach(day => {
      morningSlots.forEach(slot => {
        const labSubjects = this.subjects.filter(s => 
          s.subject_type?.toLowerCase().includes('lab') || 
          s.subject_type?.toLowerCase().includes('practical')
        );
        
        if (labSubjects.length > 0 && Math.random() < 0.5) {
          const subject = labSubjects[Math.floor(Math.random() * labSubjects.length)];
          const faculty = this.faculty.find(f => 
            f.specialization?.some(spec => 
              subject.name?.toLowerCase().includes(spec.toLowerCase())
            )
          ) || this.faculty[0];
          
          solution[day][slot] = {
            subject: subject.name,
            faculty: faculty?.name || 'TBD',
            type: subject.subject_type
          };
        }
      });
    });

    return solution;
  }

  private calculateFitness(solution: any): number {
    let score = 0;

    // Faculty workload balance
    const facultyWorkload = this.calculateFacultyWorkload(solution);
    const workloadVariance = this.calculateWorkloadVariance(facultyWorkload);
    score += (100 - workloadVariance) * 0.3;

    // Room utilization
    const roomUtilization = this.calculateRoomUtilization(solution);
    const avgRoomUtilization = Object.values(roomUtilization).reduce((a: any, b: any) => a + b, 0) / Object.keys(roomUtilization).length;
    score += avgRoomUtilization * 0.2;

    // Conflict reduction
    const conflicts = this.detectConflicts(solution);
    score += (100 - conflicts.length * 10) * 0.3;

    // Subject type preferences
    score += this.calculateSubjectTypeScore(solution) * 0.2;

    return Math.max(0, score);
  }

  private calculateWorkloadVariance(workload: { [key: string]: number }): number {
    const values = Object.values(workload);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateSubjectTypeScore(solution: any): number {
    let score = 0;
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const morningSlots = ['9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00'];

    days.forEach(day => {
      morningSlots.forEach(slot => {
        const assignment = solution[day]?.[slot];
        if (assignment) {
          if (assignment.type?.toLowerCase().includes('lab') || 
              assignment.type?.toLowerCase().includes('practical')) {
            score += 10; // Bonus for labs/practicals in morning
          }
        }
      });
    });

    return score;
  }

  private selectParent(fitnessScores: Array<{ individual: any; fitness: number }>): any {
    // Tournament selection
    const tournamentSize = 3;
    let best = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
    
    for (let i = 1; i < tournamentSize; i++) {
      const candidate = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
      if (candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    
    return best.individual;
  }

  private crossover(parent1: any, parent2: any, rate: number): any {
    if (Math.random() > rate) return JSON.parse(JSON.stringify(parent1));

    const child: any = {};
    const days = Object.keys(parent1);

    days.forEach(day => {
      child[day] = {};
      const timeSlots = Object.keys(parent1[day]);
      
      timeSlots.forEach(slot => {
        if (Math.random() < 0.5) {
          child[day][slot] = parent1[day][slot];
        } else {
          child[day][slot] = parent2[day][slot];
        }
      });
    });

    return child;
  }

  private mutate(solution: any, rate: number): any {
    const mutated = JSON.parse(JSON.stringify(solution));
    const days = Object.keys(mutated);

    days.forEach(day => {
      const timeSlots = Object.keys(mutated[day]);
      
      timeSlots.forEach(slot => {
        if (Math.random() < rate) {
          // Random mutation: change assignment or remove it
          if (Math.random() < 0.5) {
            const randomSubject = this.subjects[Math.floor(Math.random() * this.subjects.length)];
            const randomFaculty = this.faculty[Math.floor(Math.random() * this.faculty.length)];
            mutated[day][slot] = {
              subject: randomSubject.name,
              faculty: randomFaculty.name,
              type: randomSubject.subject_type
            };
          } else {
            delete mutated[day][slot];
          }
        }
      });
    });

    return mutated;
  }

  private generateNeighbor(solution: any): any {
    const neighbor = JSON.parse(JSON.stringify(solution));
    const days = Object.keys(neighbor);
    const randomDay = days[Math.floor(Math.random() * days.length)];
    const timeSlots = Object.keys(neighbor[randomDay]);
    const randomSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

    // Swap with another random slot
    const otherDay = days[Math.floor(Math.random() * days.length)];
    const otherTimeSlots = Object.keys(neighbor[otherDay]);
    const otherSlot = otherTimeSlots[Math.floor(Math.random() * otherTimeSlots.length)];

    const temp = neighbor[randomDay][randomSlot];
    neighbor[randomDay][randomSlot] = neighbor[otherDay][otherSlot];
    neighbor[otherDay][otherSlot] = temp;

    return neighbor;
  }

  private generateLocalNeighbor(solution: any): any {
    const neighbor = JSON.parse(JSON.stringify(solution));
    const days = Object.keys(neighbor);
    const randomDay = days[Math.floor(Math.random() * days.length)];
    const timeSlots = Object.keys(neighbor[randomDay]);
    const randomSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

    // Small change: modify the assignment
    if (neighbor[randomDay][randomSlot]) {
      const randomSubject = this.subjects[Math.floor(Math.random() * this.subjects.length)];
      const randomFaculty = this.faculty[Math.floor(Math.random() * this.faculty.length)];
      neighbor[randomDay][randomSlot] = {
        subject: randomSubject.name,
        faculty: randomFaculty.name,
        type: randomSubject.subject_type
      };
    }

    return neighbor;
  }

  private detectConflicts(solution: any): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];
    const facultySchedule: { [key: string]: { [day: string]: string[] } } = {};

    // Initialize faculty schedules
    this.faculty.forEach(f => {
      facultySchedule[f.id] = {};
      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
        facultySchedule[f.id][day] = [];
      });
    });

    // Check for faculty conflicts
    Object.entries(solution).forEach(([day, dayData]: [string, any]) => {
      Object.entries(dayData).forEach(([timeSlot, assignment]: [string, any]) => {
        if (assignment && assignment.faculty) {
          const faculty = this.faculty.find(f => f.name === assignment.faculty);
          if (faculty) {
            if (facultySchedule[faculty.id][day].includes(timeSlot)) {
              conflicts.push({
                type: 'faculty',
                severity: 'critical',
                description: `Faculty ${assignment.faculty} has overlapping assignments on ${day}`,
                affectedSubjects: [assignment.subject],
                affectedFaculty: [faculty.id],
                suggestedResolution: 'Reschedule one of the conflicting assignments',
                timestamp: new Date()
              });
            } else {
              facultySchedule[faculty.id][day].push(timeSlot);
            }
          }
        }
      });
    });

    return conflicts;
  }

  private calculateFacultyWorkload(solution: any): { [facultyId: string]: number } {
    const workload: { [facultyId: string]: number } = {};
    
    this.faculty.forEach(f => {
      workload[f.id] = 0;
    });

    Object.values(solution).forEach((dayData: any) => {
      Object.values(dayData).forEach((assignment: any) => {
        if (assignment && assignment.faculty) {
          const faculty = this.faculty.find(f => f.name === assignment.faculty);
          if (faculty) {
            workload[faculty.id]++;
          }
        }
      });
    });

    return workload;
  }

  private calculateRoomUtilization(solution: any): { [roomId: string]: number } {
    const utilization: { [roomId: string]: number } = {};
    
    this.rooms.forEach(room => {
      utilization[room.roomId] = 0;
    });

    // Simple calculation - in real implementation would track room assignments
    Object.values(solution).forEach((dayData: any) => {
      Object.values(dayData).forEach((assignment: any) => {
        if (assignment) {
          // Assume each assignment uses a room
          const randomRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
          if (randomRoom) {
            utilization[randomRoom.roomId]++;
          }
        }
      });
    });

    return utilization;
  }
} 